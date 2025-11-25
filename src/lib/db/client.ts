import { MongoClient, type Db } from "mongodb";

type MongoGlobals = {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoDb?: Db;
};

const globalForMongo = global as typeof globalThis & MongoGlobals;

const getMongoConfig = () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment to enable database access.",
    );
  }
  if (!dbName) {
    throw new Error(
      "MONGODB_DB (or MONGODB_DATABASE) is not set. Add it to your environment to select the database.",
    );
  }
  return { uri, dbName };
};

export const getMongoClient = async (): Promise<MongoClient> => {
  if (!globalForMongo._mongoClientPromise) {
    const { uri } = getMongoConfig();
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
};

export const getMongoDb = async (): Promise<Db> => {
  if (globalForMongo._mongoDb) return globalForMongo._mongoDb;
  const client = await getMongoClient();
  const { dbName } = getMongoConfig();
  globalForMongo._mongoDb = client.db(dbName);
  return globalForMongo._mongoDb;
};
