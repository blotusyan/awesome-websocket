import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingNestedStack } from './networking-stack';
import { ServiceNestedStack } from './service-stack';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const networking = new NetworkingNestedStack(this, 'Networking');
    const service = new ServiceNestedStack(this, 'Service', {
      vpc: networking.vpc
    });

    service.addDependency(networking);
  }
}
