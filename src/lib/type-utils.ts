/***********  TYPE UTILS *********/

// LIBS
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { type SQL } from "drizzle-orm/sql";

// PRETTYTYPE
export type PrettyType<T> = {
  [K in keyof T]: T[K];
} & object;

// SQL UTILS
type ExtractColumn<T extends AnyPgColumn> =
  T extends AnyPgColumn<infer U>
    ? U extends { notNull: true }
      ? U["data"]
      : U["data"] | null
    : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in type inference
type ExtractSqlType<T> =
  T extends AnyPgColumn<object>
    ? ExtractColumn<T>
    : T extends SQL.Aliased<infer V>
      ? V
      : never;

type OmitNevers<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

type InferTableWithDrizzleValues<T> = {
  [K in keyof T as T[K] extends never ? never : K]: ExtractSqlType<T[K]>;
};

export type InferSqlTable<T> = PrettyType<
  OmitNevers<InferTableWithDrizzleValues<T>>
>;
