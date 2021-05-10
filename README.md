# CDK Spring Pipeline

This is a blank project for TypeScript development with CDK.

## Getting Started

### Install Packages

```bash
npm i @aws-cdk/aws-route53
npm i @aws-cdk/aws-certificatemanager
npm i @aws-cdk/aws-elasticloadbalancingv2
npm i @aws-cdk/aws-certificatemanager
npm i @aws-cdk/aws-codepipeline-actions
npm i @aws-cdk/aws-iam
npm i @aws-cdk/aws-codebuild
npm i @aws-cdk/aws-ecs-patterns
npm i @types/node
```

### Bootstrap & Synth

As usual you need to login AWS account with CDK provided `bootstrap` action.
```bash
export CDK_NEW_BOOTSTRAP=0
export CDK_DEFAULT_ACCOUNT=account_id
export CDK_DEFAULT_REGION=default_region
```
```bash
cdk bootstrap --show-template > bootstrap-template.yaml 
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --template bootstrap-template.yaml
cdk synth 
```
