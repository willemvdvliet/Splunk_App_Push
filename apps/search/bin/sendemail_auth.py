import base64
import json
import smtplib

import splunk
import splunk.entity as entity
import splunk.mining.dcutils as dcu
import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context
from splunk.rest import simpleRequest
from abc import ABC, abstractmethod

defaultLogger = dcu.getLogger()

class SMTPConfig:
    def __init__(self,
                 logCtx,
                 mailserver,
                 sessionKey,
                 useSSL,
                 useTLS,
                 sslConfigAsJSON,
                 cLogger=None):

        self.logger = cLogger or defaultLogger
        self.logCtx = logCtx

        self.mailserver = mailserver
        self.sessionKey = sessionKey
        self.useSSL = useSSL
        self.useTLS = useTLS
        self.sslConfigAsJSON = sslConfigAsJSON
        self.smtp_connection = None

        self.createSMTPObj()

    def createSMTPObj(self):
        try:
            # setup the Open SSL Context
            sslHelper = ssl_context.SSLHelper()
            serverConfJSON = sslHelper.getServerSettings(self.sessionKey)
            ctx = sslHelper.createSSLContextFromSettings(
                sslConfJSON=self.sslConfigAsJSON,
                serverConfJSON=serverConfJSON,
                isClientContext=True)

            if not self.useSSL:
                self.smtp_connection = secure_smtplib.SecureSMTP(host=self.mailserver)
            else:
                self.smtp_connection = secure_smtplib.SecureSMTP_SSL(host=self.mailserver, sslContext=ctx)
            if self.useTLS:
                self.smtp_connection.ehlo()
                self.smtp_connection.starttls(ctx)

        except Exception as e:
            self.logger.error('Unable to create SMTP Object. Error=%s. Context=%s' % (str(e), self.logCtx))
            raise


class SMTPAuth(ABC):
    @abstractmethod
    def authenticate(self):
        pass


class SMTPBasicAuth(SMTPAuth):
    def __init__(self, smtp_connection, username, password):
        self.smtp_connection = smtp_connection
        self.username = username
        self.password = password
    def authenticate(self):
        try:
            self.smtp_connection.ehlo()
            self.smtp_connection.login(self.username, self.password)
        except smtplib.SMTPAuthenticationError as e:
            raise
        except Exception as e:
            err = f'Error authenticating with username and password provided. Error=%s.' % (str(e))
            raise Exception(err)


class SMTPOAuth(SMTPAuth):
    def __init__(self, smtp_connection, sessionKey, logger):
        self.sessionKey = sessionKey
        self.logger = logger or defaultLogger
        self.fromAddress, self.token = SMTPOAuth.getToken(self.sessionKey, self.logger)
        self.smtp_connection = smtp_connection

    def authenticate(self):
        try:
            if not self.fromAddress or not self.token:
                raise Exception("Received empty client ID or oAuth Token")
            self.smtp_connection.ehlo()
            self.smtp_connection.docmd('AUTH', f'XOAUTH2 {self.generate_sasl_xoauth2_string()}')
        except smtplib.SMTPAuthenticationError as e:
            err = f'Failed to authenticate with the SMTP server. Error code: {e.smtp_code}, message: {e.smtp_error}'
            self.logger.error(err)
            raise
        except Exception as e:
            err = f'Error authenticating with SMTP oAuth. Error=%s.' % (str(e))
            self.logger.error(err)
            raise

    def generate_sasl_xoauth2_string(self):
        try:
            if not self.fromAddress or not self.token:
                raise Exception("Received empty from address (sender address) or oAuth Token")
            auth_string = f"user={self.fromAddress}\x01auth=Bearer {self.token}\x01\x01"
            return base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
        except Exception as e:
            err = f'Error generating SASL XOAUTH2 string. Error=%s.' % (str(e))
            self.logger.error(err)
            raise

    @classmethod
    def getToken(cls, sessionKey, logger, namespace="system", owner="nobody"):
        try:
            # /servicesNS/nobody/system/configs/conf-alert_actions/email/token
            entityClass = ['configs', 'conf-alert_actions', 'email', 'token']
            uri = entity.buildEndpoint(
                entityClass,
                namespace=namespace,
                owner=owner
            )
            responseHeaders, responseBody = simpleRequest(uri, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)
            alertConfig = json.loads(responseBody)
            token = alertConfig['entry'][0]['content']['token']['value']
            emailConfig = entity.getEntity('configs/conf-alert_actions', 'email', sessionKey=sessionKey)

            if not emailConfig.get('from') or not token:
                return None, None
        except splunk.ResourceNotFound:
            return None, None
        except Exception as e:
            logger.error('Could not retrieve token from alert actions conf file. Error=%s' % str(e))
            raise Exception('Could not retrieve token from alert actions. Error: %s' % str(e))

        return emailConfig.get('from'), token.strip()

    @classmethod
    def isOAuthEnabled(cls, sessionKey, logger):
        try:
            _, token = SMTPOAuth.getToken(sessionKey, logger)
            return token is not None
        except Exception:
            logger.warning('Could not determine if OAuth is enabled. Defaulting to Basic Auth.')
            return False
