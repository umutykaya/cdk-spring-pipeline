# Enable SSH Password Authentication

Bastion host itself has built-in integration with AWS SSM. So that, SSM Agent has been already configured by launching the project. All you need to do is setting password authentication to the host.

Be sure that you set the AWS profile correctly. Please go ahead and connect bastion host.
```bash
export AWS_PROFILE=profile-name
aws ssm start-session --target instance-id
```
```bash
sudo -i 
vim /etc/ssh/sshd_config
```
Change following attribute to `yes`

```bash
PasswordAuthentication yes
```
Then, restart sshd service in Amazon Linux instance

```bash
service sshd restart
```
Then, you can follow-up the session manager article in [here](https://github.com/umutykaya/cdk-spring-pipeline/blob/master/assets/docs/ssm_session_manager.md) to start port forwarding session to RDS PostgreSQL instance.