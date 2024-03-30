import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { configDotenv } from "dotenv";

export class AWSBucket {

    public readonly client: S3Client;

    public constructor() {
        configDotenv();
        this.client = new S3Client({ region: "ap-southeast-4", });
    }

    public push(bucketName: string, fileName: string, data: object): void {
        this.client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: JSON.stringify(data)
        })).catch((e: unknown) => console.error(e));
    }

    public dateTime(ms: number): string {
        const date = new Date(ms);
        return `D${date.toISOString().substring(0, 19).replace(/[-:]/gu, "")}`
    };

}
