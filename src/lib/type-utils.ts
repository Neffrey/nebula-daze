/***********  TYPE UTILS *********/

// LIBS
import { type SQL } from "drizzle-orm/sql";
import { type MySqlColumn } from "drizzle-orm/mysql-core";

// PRETTIFY
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & object;

// SQL UTILS
type ExtractTypeFromMySqlColumn<T extends MySqlColumn> = T extends MySqlColumn<
  infer U
>
  ? U extends { notNull: true }
    ? U["data"]
    : U["data"] | null
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in type inference
type ExtractSqlType<T> = T extends MySqlColumn<infer U, object>
  ? ExtractTypeFromMySqlColumn<T>
  : T extends SQL.Aliased<infer V>
  ? V
  : never;

type OmitNevers<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

type InferTableWithDrizzleValues<T> = {
  [K in keyof T as T[K] extends never ? never : K]: ExtractSqlType<T[K]>;
};

export type InferSqlTable<T> = Prettify<
  OmitNevers<InferTableWithDrizzleValues<T>>
>;
