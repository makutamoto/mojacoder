import * as cdk from '@aws-cdk/core'
import { PublicHostedZone } from '@aws-cdk/aws-route53'
import { Certificate, CertificateValidation, DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'

export class Zone extends cdk.Construct {
    public readonly certificate: Certificate
    public readonly zone: PublicHostedZone

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.zone = new PublicHostedZone(this, 'zone', {
            zoneName: 'mojacoder.app',
        })
        this.certificate = new DnsValidatedCertificate(this, 'mojacoder-domain-certificate', {
            domainName: '*.mojacoder.app',
            hostedZone: zone,
            region: 'us-east-1',
            validation: CertificateValidation.fromDns(zone),
        })
    }
}
