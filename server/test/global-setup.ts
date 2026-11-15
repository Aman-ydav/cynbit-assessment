import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

let mongod: MongoMemoryServer | undefined;

/** Starts one in-memory MongoDB for the whole test run and shares its URI with the workers. */
export async function setup(project: TestProject) {
  mongod = await MongoMemoryServer.create();
  project.provide("mongoUri", mongod.getUri("bitelevate_test"));
}

export async function teardown() {
  await mongod?.stop();
}

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}
