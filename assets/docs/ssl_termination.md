# SSL/TLS Termination

Generate a key with custom password.
```bash
keytool -genkeypair -alias baeldung -keyalg RSA -keysize 2048 -keystore baeldung.jks -validity 3650
```

```bash
keytool -importkeystore -srckeystore baeldung.jks -destkeystore baeldung.p12 -deststoretype pkcs12
```

Please add the following properties to `application.properties` file. It is located in path of `main/resources/`
```conf
spring.data.rest.base-path=/api

# SSL
server.port=8443
# The format used for the keystore. It could be set to JKS in case it is a JKS file
server.ssl.key-store-type=PKCS12
# The path to the keystore containing the certificate
server.ssl.key-store=classpath:baeldung.p12
# The password used to generate the certificate
server.ssl.key-store-password=<password>
# The alias mapped to the certificate
server.ssl.key-alias=baeldung

# PKCS12 or JKS
server.ssl.keyStoreType=PKCS12

# Spring Security
# security.require-ssl=true

```
```bash
aws iam upload-server-certificate --server-certificate-name ExampleCertificate
                                    --certificate-body file://Certificate.pem
                                    --certificate-chain file://CertificateChain.pem
                                    --private-key file://PrivateKey.pem
                                    --tags '{"Name": "umutykaya"}'
									
```									
```bash
cat <<EOF > castore.cfg
[ req ]
default_bits = 2048
default_keyfile = my-aws-private.key
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no
[ req_distinguished_name ]
C = TR
ST = Istanbul
L = Kadikoy
O = umutykaya.com
OU = umutykaya.com
CN= ecs-encryption.awsblogs.info ## Use your domain
emailAddress = yalcinkayaumut@outlook.com ## Use your email address
[v3_ca]
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer:always
basicConstraints = CA:true
[v3_req]
## Extensions to add to a certificate request
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
EOF
```

```
openssl genrsa -out castore.key 2048
openssl req -x509 -new -nodes -key castore.key -days 3650 -config castore.cfg -out castore.pem
openssl genrsa -out my-aws-private.key 2048
openssl req -new -key my-aws-private.key -out my-aws.csr -config castore.cfg
openssl x509 -req -in my-aws.csr -CA castore.pem -CAkey castore.key -CAcreateserial  -out my-aws-public.crt -days 365
```

* https://www.ibm.com/docs/en/api-connect/5.0.x?topic=profiles-generating-self-signed-certificate-using-openssl

* https://medium.com/@chamilad/adding-a-self-signed-ssl-certificate-to-aws-acm-88a123a04301
