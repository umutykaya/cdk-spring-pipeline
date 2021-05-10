# CDK Spring Pipeline

## Overview

The pipeline intended to integrate any kind of spring boot web service to ECS Fargate service 
CDK applications with enhanced integration and unittest capability.
### Related links
* Spring Boot: https://spring.io/projects/spring-boot
* Spring Cloud: https://spring.io/projects/spring-cloud
* AWS Cloud Development Kit: https://docs.aws.amazon.com/cdk/latest/guide/home.html

## Architecture
<br>
<p align="center">
    <img src="../assets/img/diagram.png" />
</p>

## Getting Started

You should see the following file structure while you clone the project.

```
├── README.md
├── assets
├── bin
│   └── cdk-spring-pipeline.ts
├── bootstrap-template.yaml
├── cdk.json
├── jest.config.js
├── lib
│   └── cdk-spring-pipeline-stack.ts
├── package-lock.json
├── package.json
├── test
│   └── cdk-spring-pipeline.test.ts
└── tsconfig.json

```

### Prerequisites:

- cdk version : 1.95.0 (build 28ba8b4)
- Maven and npm package managers

### Checklist

- [ ] Create Secret Manager with Github token
- [ ] Add Environment variables
- [ ] Use your own AWS CLI

Suppose that you've already fork or clone the repository. Please find the main class `CDKSpringPipeline` and change the attributes and fill with your own credentials.

Inside of the `gh_token.json` you should pass value as plain text format. ex: `ghp_1234bkLW89212`.Then, create a Secret Manager resource called `pipeline/secret`.

### Github Credentials

You need to create following
- Personal access token: https://github.com/settings/tokens/new
- Token: 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

`CDKSpringPipeline` class`cdk-spring-pipeline-stack.ts`. Dependant on your secret name oauth value is mutable and you can change it in below.
```typescript
new codepipelineactions.GitHubSourceAction({
  actionName: 'GitHub_Source',
  owner: '<nickname>',
  repo: '<repo_name>',
  branch: '<branch>',
  oauthToken: cdk.SecretValue.secretsManager("<secret_name>"),
  output: sourceOutput
})
```
```bash
aws secretsmanager create-secret --name pipeline/spring-boot-react \
    --description "spring-boot-react" \
    --secret-string file://gh_token.json
```

```typescript
new codepipelineactions.GitHubSourceAction({
  actionName: 'GitHub_Source',
  owner: '<>',
  repo: 'spring-boot-react',
  branch: 'master',
  oauthToken: cdk.SecretValue.secretsManager("pipeline/secret"),
  output: sourceOutput
})
```

