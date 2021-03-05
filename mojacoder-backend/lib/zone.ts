import * as cdk from '@aws-cdk/core'
import { ARecord, PublicHostedZone, RecordTarget } from '@aws-cdk/aws-route53'
import { Certificate, CertificateValidation, DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'

export class Zone extends cdk.Construct {
    public readonly certificate: Certificate
    public readonly zone: PublicHostedZone

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.zone = new PublicHostedZone(this, 'zone', {
            zoneName: 'mojacoder.app',
        })
        new ARecord(this, 'frontendA', {
            target: RecordTarget.fromIpAddresses('76.76.21.21'),
            zone: this.zone,
        })
        this.certificate = new DnsValidatedCertificate(this, 'mojacoder-domain-certificate', {
            domainName: '*.mojacoder.app',
            hostedZone: this.zone,
            region: 'us-east-1',
            validation: CertificateValidation.fromDns(this.zone),
        })
    }
}
