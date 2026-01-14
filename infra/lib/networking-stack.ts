import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class NetworkingNestedStack extends NestedStack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
      /**
       * public subnets accept traffic, private subnets run the app
       */
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC
        },
        {
          name: 'application',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS
        }
      ]
    });
  }
}
