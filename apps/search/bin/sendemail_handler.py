import re
import socket

from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from splunk.util import normalizeBoolean
from sendemail_auth import SMTPOAuth, SMTPBasicAuth, SMTPConfig

import splunk.admin as admin
import splunk.entity as en
import splunk.mining.dcutils as dcu
import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context

import sendemail_common as sec

logger = dcu.getLogger()

charset = "UTF-8"

def isASCII(str):
    for i in str:
        if ord(i) > 127:
            return False
    return True

def toBool(strVal):
   if strVal == None:
       return False

   lStrVal = strVal.lower()
   if lStrVal == "true" or lStrVal == "t" or lStrVal == "1" or lStrVal == "yes" or lStrVal == "y" :
       return True 
   return False


class SendemailRestHandler(admin.MConfigHandler):

  def __init__(self, scriptMode, ctxInfo):
      admin.MConfigHandler.__init__(self, scriptMode, ctxInfo)
      self.shouldAutoList = False

  # get firs arg
  def gfa(self, name, defaultVal=''):
      if self.hasNonEmptyArg(name):
         val = self.callerArgs.get(name, [defaultVal])[0]
         if val != None: return val
      return defaultVal

  def hasNonEmptyArg(self, name):
      return name in self.callerArgs and self.callerArgs.get(name) != None

  def setup(self):
    if self.requestedAction == admin.ACTION_CREATE or self.requestedAction == admin.ACTION_EDIT:
      for arg in ['to', 'body']:
          self.supportedArgs.addReqArg(arg)

      for arg in ['cc', 'bcc', 'from', 'subject', 'format', 'username', 'password', 'server', 'use_ssl', 'use_tls']:
          self.supportedArgs.addOptArg(arg)

    userInfo = en.getEntity('/authentication/', 'current-context', sessionKey=self.getSessionKey())
    if userInfo.get('username') != 'splunk-system-user':
        raise admin.PermissionsException("This handler can only be called by the Splunk system user.")

  def handleList(self, confInfo):
      pass 
  
  def handleCreate(self, confInfo):
    message    = MIMEMultipart()
    subject    = self.gfa('subject')
    body       = self.gfa('body')
    bodyformat = self.gfa('format', 'html')

    server = self.gfa('server', 'localhost')

    username   = self.gfa('username')
    password   = self.gfa('password')

    use_ssl    = toBool(self.gfa('use_ssl'))
    use_tls    = toBool(self.gfa('use_tls'))

    sessionKey = self.getSessionKey()

    sslSettings = self.getAlertActions(sessionKey)

    # Open debate whether we should get user and password from alert actions
    # username = sslSettings.get('auth_username', '')
    # password = sslSettings.get('clear_password', '')

    if isASCII(subject):
        message['Subject'] = subject
    else:
        message['Subject'] = Header(subject, charset)

    recipients = []
    for t in self.callerArgs.get('to'):
        recipients.extend(sec.EMAIL_DELIM.split(t))
    message['To'] = ', '.join(self.callerArgs.get('to'))

    if self.hasNonEmptyArg('cc') :
       cc = [x for x in self.callerArgs.get('cc') if x != None]
       if len(cc) > 0:
           message['Cc'] = ', '.join(cc)
           for t in cc:
               recipients.extend(sec.EMAIL_DELIM.split(t))

    if self.hasNonEmptyArg('bcc'):
       bcc = [x for x in self.callerArgs.get('bcc') if x != None]
       if len(bcc) > 0:
          message['Bcc'] = ', '.join(bcc)
          for t in bcc:
              recipients.extend(sec.EMAIL_DELIM.split(t))

    message.attach(MIMEText(body, bodyformat, _charset=charset))

    audit_msg = 'Email for backgrounded search job: subject="%s", recipients="%s", server="%s"' % (subject, recipients, server)

    emailSettings, isSCEmailValidationEnabled, isSCLimitsEnabled = sec.EmailLimits.getLimits(sessionKey, logger)
    if isSCEmailValidationEnabled:
        validation = str(emailSettings.get('validation', 'basic')).strip().lower()
        if validation not in ('basic', 'enhanced', 'strict'):
            logger.debug('Invalid value for validation in email stanza in limits.conf, using basic as default validation')
            validation = 'basic'

        if validation in ('strict', 'enhanced'):
            # always post any errors / feedback to UI so user knows about it
            sec.SplunkEmailMessage(sessionKey,
                                   message,
                                   sslSettings.get('allowedDomainList'),
                                   audit_msg,
                                   emailSettings,
                                   cLogger=logger).send(
                                        use_tls,
                                        use_ssl,
                                        sslSettings,
                                        username,
                                        password,
                                        sslSettings.get('mailserver', 'localhost'))
            return

    try:
        if isSCLimitsEnabled:
            sec.SplunkEmailMessage.enforceLimits(recipients, emailSettings, logger, audit_msg)
    except Exception as e:
        logger.error('Skipping enforcing limits. Could not retrieve email limits from config. Error - %s' % (str(e)))

    sender = 'splunk'
    if self.hasNonEmptyArg('from'):
       sender = self.gfa('from', sender)

    if sender.find("@") == -1:
       sender = sender + '@' + socket.gethostname()
       if sender.endswith("@"):
          sender = sender + 'localhost'

    message['From'] = sender

    smtpConfig = SMTPConfig("", server, sessionKey, use_ssl, use_tls, sslSettings)

    if SMTPOAuth.isOAuthEnabled(sessionKey, logger):
        smtp = SMTPOAuth(smtpConfig.smtp_connection, sessionKey, logger)
        smtp.authenticate()
    elif len(username) > 0 and password is not None and len(password) >0:
        smtp = SMTPBasicAuth(smtpConfig.smtp_connection, username, password)
        smtp.authenticate()
    else: # For SMTP servers with no authentication
        # smtpConfig object has an instance of smtp_connection that is instantiated
        smtp = smtpConfig

    # Installed SMTP daemon may not support UTF8.
    # This can only be determined if SMTPNotSupportedError is raised. 
    # Try without SMTPUTF8 option if raised.
    logger.info('Sending %s, sender = %s' % (audit_msg, sender))

    # Installed SMTP daemon may not support UTF8 as well as
    # it may throw other exceptions also.

    error = sec.sendEmailWithUTF8(smtp.smtp_connection, sender, recipients, message.as_string())

    if error is not None:
        logger.debug('send mail with utf8 failed. retrying without utf8 option. Error: %s', str(error))
        smtp.smtp_connection.sendmail(sender, recipients, message.as_string())

    smtp.smtp_connection.quit()

  def getAlertActions(self, sessionKey):
    settings = None
    try:
        settings = en.getEntity('/configs/conf-alert_actions', 'email', sessionKey=sessionKey)
        logger.debug("sendemail_handler.getAlertActions conf file settings %s" % settings)
    except Exception as e:
        logger.error("Could not access or parse email stanza of alert_actions.conf. Error=%s" % str(e))

    return settings

# initialize the handler
admin.init(SendemailRestHandler, admin.CONTEXT_APP_AND_USER)

