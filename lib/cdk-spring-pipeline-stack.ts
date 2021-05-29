import * as cdk from '@aws-cdk/core';
import ec2 = require("@aws-cdk/aws-ec2");
import rds = require('@aws-cdk/aws-rds');
import ecr = require('@aws-cdk/aws-ecr');
import ecs = require("@aws-cdk/aws-ecs");
import ecs_patterns = require("@aws-cdk/aws-ecs-patterns");
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipelineactions = require('@aws-cdk/aws-codepipeline-actions');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import acm = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');

const myIP = process.env.myIP || '0.0.0.0/0'; 
const domainName = process.env.domainName || 'subdomain.example.com';
const certArn = process.env.certArn || 'arn:aws:acm:<region>:<account_id>:certificate/<certificate_id>';
const hostedZoneId = process.env.hostedZoneId || 'hosted_zone_id';
const rdsSecretName = process.env.rdsSecretName || 'pipeline/rds';
const owner = process.env.owner || 'umutykaya';
const repo = process.env.repo || 'spring-boot-react';
const branch = process.env.branch || 'master';
const ghbSecretName = process.env.ghbSecretName || 'pipeline/secret';
const clusterName = process.env.clusterName || 'spring-cluster';
const serviceName = process.env.serviceName || 'spring-service';

export class CDKSpringPipeline extends cdk.Stack {
  projectName: string = 'cdk-spring-pipeline';
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Create a new VPC with single NAT Gateway
     */
    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 2,
    });

    /**
     *  RDS Postgres 
     */
    const DBGroup = new ec2.SecurityGroup(this, 'Proxy to DB Connection', {
      vpc
    });
    const serviceToDBGroup = new ec2.SecurityGroup(this, 'ECS to DB Connection', {
      vpc
    });

    const bastionToDBGroup = new ec2.SecurityGroup(this, 'bastion to DB Connection', {
      vpc
    });

    DBGroup.addIngressRule(DBGroup, ec2.Port.tcp(5432), 'allow proxy to db');

    DBGroup.addIngressRule(serviceToDBGroup, ec2.Port.tcp(5432), 'allow ECS to db');
    DBGroup.addIngressRule(bastionToDBGroup, ec2.Port.tcp(5432), 'allow bastion to db');
    bastionToDBGroup.addIngressRule(ec2.Peer.ipv4(myIP), ec2.Port.tcp(22));
    serviceToDBGroup.addIngressRule(ec2.Peer.ipv4(myIP), ec2.Port.tcp(5432));
    
    const engine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12_3 });

    const rdsInstance = new rds.DatabaseInstance(this, 'InstanceWithUsername', {
      engine,
      vpc,
      securityGroups: [DBGroup],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      credentials: rds.Credentials.fromGeneratedSecret('postgres',{secretName: rdsSecretName}), // Creates an admin user of postgres with a generated password
      publiclyAccessible: true,
      instanceType:  ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

      //create bastion to init/alter db schema
      const bastion = new ec2.BastionHostLinux(this, "bastion", {
        vpc: vpc,
        instanceName: "bastion",
        subnetSelection: {subnetType: ec2.SubnetType.PUBLIC},
        securityGroup: bastionToDBGroup,
      });
  
      bastion.instance.addUserData(
        "sudo echo 'GatewayPorts yes' >> /etc/ssh/sshd_config",
        "sudo service sshd restart",
      );
  
      bastion.allowSshAccessFrom(ec2.Peer.ipv4(myIP));
      
    /**
     * Route53 and ACM constructs
     */

     const certificate = acm.Certificate.fromCertificateArn(this, 'certificate', certArn);
 
     const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LB', {
       loadBalancerName: `${this.projectName}-lb`,
       vpc,
       internetFacing: true
     });

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'hostedZone', {
      hostedZoneId,
      zoneName: 'commencis-cloud.com'
    })

    const cluster = new ecs.Cluster(this, "cluster", {
      clusterName,
      vpc: vpc,
      containerInsights: true,
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "FargateserviceStack",
    });

    const taskRole = new iam.Role(this, 'ecsTaskExecutionRole', {
      roleName: 'ecsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // ***ECS Contructs***

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "taskDef", {
      memoryLimitMiB: 4096,
      cpu: 2048,
      taskRole: taskRole
    });

    taskDef.addToExecutionRolePolicy(executionRolePolicy);

    const container = taskDef.addContainer('container', {
      image: ecs.ContainerImage.fromRegistry("tomcat"), //TO-DO: Get from ECR_REPO_URI
      environment: { // clear text, not for sensitive data
        JAVA_OPTS: '-Djava.awt.headless=true',
      },
      logging
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });
    

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "fargateService", {
      serviceName,
      loadBalancer: loadBalancer,
      cluster: cluster,
      securityGroups: [serviceToDBGroup],
      taskDefinition: taskDef,
      domainZone: hostedZone,
      domainName,
      // redirectHTTP: true,
      minHealthyPercent: 100,
      // certificate: certificate,
      healthCheckGracePeriod: cdk.Duration.seconds(30)
    });

    // const scaling = fargateService.service.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 2 });
    // scaling.scaleOnCpuUtilization('CpuScaling', {
    //   targetUtilizationPercent: 50,
    //   scaleInCooldown: cdk.Duration.seconds(60),
    //   scaleOutCooldown: cdk.Duration.seconds(60)
    // });

    fargateService.targetGroup.configureHealthCheck({
      path: "/",
      healthyHttpCodes: '200-499'
    });

    // ***PIPELINE CONSTRUCTS***

    // ECR - repo
    const ecrRepo = new ecr.Repository(this, 'EcrRepo', {
      imageScanOnPush: true,
      repositoryName: 'spring-boot-react',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const gitHubSource = codebuild.Source.gitHub({
      owner,
      repo,
    });


    // CODEBUILD - codeBuildProject
    const codeBuildProject = new codebuild.Project(this, 'project', {
      projectName: `${this.projectName}`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true
      },
      environmentVariables: {
        'CLUSTER_NAME': {
          value: `${cluster.clusterName}`
        },
        'REPOSITORY_URI': {
          value: `${ecrRepo.repositoryUri}`
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml')
    });


    // PIPELINE STAGES

    /* Assets Source Bucket will be used as a codebuild source for the react code */
    const sourceAssetBucket = new s3.Bucket(this, 'SourceAssetBucket', {
      bucketName: `source-assets-${this.projectName}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    /* Pipeline Artifacts Bucket is used by CodePipeline during Builds */
    const pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `codepipeline-artifacts-${this.projectName}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    /* CodeBuild Roles/Policies */
    //#region
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: 'CodeBuildRole',
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: [
        sourceAssetBucket.bucketArn,
        pipelineArtifactsBucket.bucketArn
      ]
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:CreateLogGroup', 'cloudfront:CreateInvalidation'],
      resources: ['*'],
    }));

    const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      roleName: 'CodePipelineRole',
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com')
    });

    codePipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: [
        sourceAssetBucket.bucketArn,
        pipelineArtifactsBucket.bucketArn,
      ]
    }));

    cdk.Tags.of(codeBuildProject).add('app-name', `${this.projectName}`);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const codePipeline = new codepipeline.Pipeline(this, 'AssetsCodePipeline', {
      pipelineName: `${this.projectName}`,
      role: codePipelineRole,
      artifactBucket: pipelineArtifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineactions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner,
              repo,
              branch,
              oauthToken: cdk.SecretValue.secretsManager(ghbSecretName),
              output: sourceOutput
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineactions.CodeBuildAction({
              actionName: 'build-and-deploy',
              project: codeBuildProject,
              input: sourceOutput,
              outputs: [buildOutput]
            }),
          ],
        },
        {
          stageName: 'Deploy-to-ECS',
          actions: [
            new codepipelineactions.EcsDeployAction({
              actionName: 'DeployAction',
              service: fargateService.service,
              imageFile: new codepipeline.ArtifactPath(buildOutput, 'imagedefinitions.json')
            })],
        }
      ],
    });

    ecrRepo.grantPullPush(codeBuildProject.role!)
    codeBuildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "ecs:DescribeCluster",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      resources: [`${cluster.clusterArn}`],
    }));

    //OUTPUT
    new cdk.CfnOutput(this, "publicDNS", { value: bastion.instance.instancePublicDnsName });
    new cdk.CfnOutput(this, "instanceID", { value: bastion.instanceId });
    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, "rdsSecretName", { value: rdsSecretName });
    new cdk.CfnOutput(this, 'RDSEndpoint', { value: rdsInstance.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'RDSIdentifier', { value: rdsInstance.instanceIdentifier });

  }
}