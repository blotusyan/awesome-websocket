import { Duration, NestedStack, NestedStackProps, Annotations } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AmazonLinuxEdition,
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  LaunchTemplate,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData
} from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface ServiceNestedStackProps extends NestedStackProps {
  vpc: IVpc;
}

export class ServiceNestedStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ServiceNestedStackProps) {
    super(scope, id, props);

    const imageUri = process.env.CONTAINER_IMAGE_URI;
    if (!imageUri) {
      Annotations.of(this).addError('Set CONTAINER_IMAGE_URI environment variable to the ECR image URI.');
      throw new Error('Missing CONTAINER_IMAGE_URI environment variable');
    }

    const appPort = 3000;

    const lbSecurityGroup = new SecurityGroup(this, 'LoadBalancerSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow internet access to the ALB'
    });
    lbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

    const asgSecurityGroup = new SecurityGroup(this, 'AsgSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow ALB traffic to application instances'
    });
    asgSecurityGroup.addIngressRule(lbSecurityGroup, Port.tcp(appPort));

    /** Bootstrap EC2 instances with Docker and run the container */
    const userData = UserData.forLinux();
    userData.addCommands(
      'sudo yum update -y',
      'sudo amazon-linux-extras install docker -y',
      'sudo service docker start',
      'sudo usermod -a -G docker ec2-user',
      `aws ecr get-login-password --region ${this.region} | sudo docker login --username AWS --password-stdin ${imageUri.split('/')[0]}`,
      `sudo docker run -d --restart unless-stopped -p ${appPort}:${appPort} ${imageUri}`
    );

    const instanceRole = new Role(this, 'AppInstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    });
    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const launchTemplate = new LaunchTemplate(this, 'AppLaunchTemplate', {
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition: AmazonLinuxEdition.STANDARD
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      securityGroup: asgSecurityGroup,
      userData,
      role: instanceRole
    });

    const asg = new AutoScalingGroup(this, 'AppAsg', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 1,
      launchTemplate
    });

    const alb = new ApplicationLoadBalancer(this, 'AppAlb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: lbSecurityGroup,
      vpcSubnets: { subnetType: SubnetType.PUBLIC }
    });

    /** TODO(wayne): hot swap to https */
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      open: true
    });

    /** Port 3000 hosts both the HTTP static server (for the initial page load) 
     * and the WebSocket gateway (for real-time chat). 
     * The ALB simply forwards 80→3000, and inside the instance httpserver handles everything. */
    listener.addTargets('AsgTarget', {
      port: appPort,
      protocol: ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        path: '/',
        healthyHttpCodes: '200-399',
        interval: Duration.seconds(30)
      }
    });

    this.node.addMetadata('loadBalancerDnsName', alb.loadBalancerDnsName);
  }
}
