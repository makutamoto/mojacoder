import * as cdk from '@aws-cdk/core'
import { ARecord, PublicHostedZone, RecordTarget } from '@aws-cdk/aws-route53'
import { Certificate, CertificateValidation, DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'

export class Zone extends cdk.Construct {
    public readonly certificate: Certificate

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        const hostedZone = new PublicHostedZone(this, 'zone', {
            zoneName: 'mojacoder.app',
        })
        new ARecord(this, 'frontend', {
            target: RecordTarget.fromIpAddresses('76.76.21.21'),
            zone: hostedZone,
            recordName: '@',
        })
        // this.certificate = new DnsValidatedCertificate(this, 'mojacoder-domain-certificate', {
        //     domainName: '*.mojacoder.app',
        //     hostedZone,
        //     region: 'us-east-1',
        //     validation: CertificateValidation.fromDns(hostedZone),
        // })
    }
}
