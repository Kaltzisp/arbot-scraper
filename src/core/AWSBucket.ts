import { GetObjectCommand, ListObjectsCommand, PutObjectCommand, type PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import type { MarketData } from "../WebScraper/Scraper.js";
import { configDotenv } from "dotenv";

export class AWSBucket {

    public readonly client: S3Client = new S3Client({ region: "ap-southeast-4", });
    private readonly bucketName = "arbot-webscraper-bucket";

    public constructor() {
        configDotenv();
    }

    public async push(marketData: MarketData): Promise<PutObjectCommandOutput> {
        const response = await this.client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: `marketData-${this.dateTime(marketData.meta.scrapedAt)}`,
            Body: JSON.stringify(marketData)
        }));
        return response;
    }

    public async getLatest(): Promise<MarketData> {
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
    }

    public dateTime(ms: number): string {
        const date = new Date(ms);
        return `D${date.toISOString().substring(0, 19).replace(/[-:]/gu, "")}`
    };

}
