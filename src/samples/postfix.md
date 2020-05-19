[comment]: # (title: Setup a Posfix Email Relay Service)
[comment]: # (version: v1.0)
[comment]: # (author: Kuan Cheang)

# Setup a Postfix Email Relay Service

[How to send emails from localhost (MAC OS X El Capitan) \| Developer files](https://www.developerfiles.com/how-to-send-emails-from-localhost-mac-os-x-el-capitan/)

The home server need to send an email to my google account (ku4ncheang@gmail.com) due to the ip address of home network is changed. If it is sent by localhost service, Google will block the email until it is authenticated or from an authorized smtp server.

### Conclusion
If u want to server to sending an email via `ssh command`, you have to setup a relay postfix service. It is very useful in creating a shell script `crontab` job to send an email to someone who should be notified.

<!-- toc -->

- [Server](#Server)
- [Configure](#Configure)
- [Turn on less secure apps (Only Gmail)](#Turn-on-less-secure-apps-Only-Gmail)
- [Testing](#Testing)
- [Others](#Others)

<!-- tocstop -->

## Configure
1. Start your postfix service in MacOS
~~~
sudo postfix start
~~~
2. Edit postfix configure file
~~~
sudo vi /etc/postfix/main.cf
~~~
3. Added following lines in the `main.cf`
~~~
# Gmail SMTP
relayhost=smtp.gmail.com:587
# Enable SASL authentication in the Postfix SMTP client.
smtp_sasl_auth_enable=yes
smtp_sasl_password_maps=hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options=noanonymous
smtp_sasl_mechanism_filter=plain
# Enable Transport Layer Security (TLS), i.e. SSL.
smtp_use_tls=yes
smtp_tls_security_level=encrypt
tls_random_source=dev:/dev/urandom
~~~
4. Add the account information into the `sasl_passwd` file
~~~
sudo vi /etc/postfix/sasl_passwd
~~~
~~~
smtp.gmail.com:587 your_email@gmail.com:your_password
~~~
5. Create a postmap db, this will create the file sasl_passwd.db.
~~~
sudo postmap /etc/postfix/sasl_passwd
~~~


## Turn on less secure apps (Only Gmail)

In Gmail, we must switch on the option [Access for less secure apps](https://www.google.com/settings/security/lesssecureapps), otherwise we will get the error:
`SASL authentication failed`

## Testing
Sending an email via relay smtp
~~~
date | mail -s testing your_email@gmail.com
~~~
Check the email queue by `mailq`.
~~~
mailq
~~~
Check the mail log to ensure it work correctly.
~~~
tail -f /var/log/mail.log
~~~
## Others
Clear all the email queue
~~~
sudo postsuper -d ALL
~~~
