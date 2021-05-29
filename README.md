# CDK Spring Pipeline

## Overview

The pipeline intended to integrate any kind of spring boot web service to [ECS Fargate](https://github.com/umutykaya/cdk-spring-pipeline/blob/master/assets/docs/ecs_overview.md). CDK applications provide Infrastructure [is](https://youtu.be/ZWCvNFUN-sU) Code capability. It is simple to have integration and unittests of your application during the pipeline process.

### Related links
* Spring Boot: https://spring.io/projects/spring-boot
* Spring Cloud: https://spring.io/projects/spring-cloud
* AWS Cloud Development Kit: https://docs.aws.amazon.com/cdk/latest/guide/home.html

## Architecture
<br>
<p align="center">
    <img src="assets/img/diagram-v2.png" />
</p>

## Getting Started

You can see the following file structure while you clone the project. 

```
├── assets
│   ├── docs
│   ├── img
│   ├── template.drawio
│   └── template.html
├── bin
│   └── cdk-spring-pipeline.ts
├── bootstrap-template.yaml
├── cdk.json
├── diagram.png.dot
├── jest.config.js
├── lib
│   └── cdk-spring-pipeline-stack.ts
├── package-lock.json
├── package.json
├── readme.md
├── test
│   └── cdk-spring-pipeline.test.ts
└── tsconfig.json

```

### Prerequisites:

- CDK CLI version : 1.95.0 >= 
- Maven and NPM package manager

### Checklist

- [ ] Use your own AWS CLI Credentials
- [ ] Create Secret Manager with Github token
- [ ] Add Environment variables
- [ ] AWS CDK Bootstrap, Sync &

Suppose that you've already fork or clone the repository. Please find the main class `CDKSpringPipeline` and change the attributes and fill with your own credentials.

### Github Credentials

You need to create following
- Personal access token: https://github.com/settings/tokens/new
- Token: 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

`CDKSpringPipeline` class`cdk-spring-pipeline-stack.ts`. Dependant on your secret name oauth value is mutable and you can change it. Inside of the `gh_token.json` you should pass value as plain text format. ex: `ghp_1234bkLW89212`. [Here](https://github.com/umutykaya/cdk-spring-pipeline/blob/master/assets/docs/github_token.md), it explains to create Github  personal access token. Then, create a Secret Manager resource called `pipeline/secret`.

```bash
aws secretsmanager create-secret --name pipeline/spring-boot-react \
    --description "spring-boot-react" \
    --secret-string file://gh_token.json
```
### Environment Variables


```bash
export myIP='0.0.0.0/0'
export domainName='subdomain.example.com'
export certArn='arn:aws:acm:<region>:<account_id>:certificate/<certificate_id>'
export hostedZoneId='zone_id'
export rdsSecretName='pipeline/rds'
export owner='repo_owner'
export repo='repo_name'
export branch='master'
export ghbSecretName='pipeline/secret'
export clusterName='spring-cluster'
export serviceName='spring-service'
```

## Workflow
To run the project, use below scripts iteratively in your terminal.

```bash
export CDK_NEW_BOOTSTRAP=0
export CDK_DEFAULT_ACCOUNT=<account_id>
export CDK_DEFAULT_REGION=<region>
cdk bootstrap --show-template > bootstrap-template.yaml
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --template bootstrap-template.yaml
```

Install project specific dependencies.

```bash
npm install @types/node
npm install 
npm run build
```
You can check diff of changes, synthesize your application stack and deploy.

```bash
cdk diff
cdk synth
cdk deploy
```