import { GetObjectCommand, ListObjectsCommand, PutObjectCommand, type PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import type { MarketData } from "../WebScraper/Scraper.js";

export const AWSBucket = {

    client: new S3Client({ region: "ap-southeast-4", }),
    bucketName: "arbot-webscraper-bucket",

    async push(marketData: MarketData): Promise<PutObjectCommandOutput> {
        const response = await this.client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: "marketData",
            Body: JSON.stringify(marketData),
            ContentType: "application/json"
        }));
        return response;
    },

    async getLatest(): Promise<MarketData> {
        const bucketResponse = await this.client.send(new ListObjectsCommand({
            Bucket: this.bucketName
        }));
        const latestKey = bucketResponse.Contents![bucketResponse.Contents!.length - 1].Key;
        const fileResponse = await this.client.send(new GetObjectCommand({
            Bucket: this.bucketName,
            Key: latestKey
        }));
        const json = await fileResponse.Body?.transformToString();
        return JSON.parse(json!) as MarketData;
    },

    dateTime(ms: number): string {
        const date = new Date(ms);
        return `D${date.toISOString().substring(0, 19).replace(/[-:]/gu, "")}`
    }

}
