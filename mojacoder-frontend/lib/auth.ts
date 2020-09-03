import { createGetServerSideAuth, createUseAuth } from "aws-cognito-next";
import pems from "../pems.json";

export const getServerSideAuth = createGetServerSideAuth({ pems });
export const useAuth = createUseAuth({ pems });

export * from "aws-cognito-next";
