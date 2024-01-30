import { APIGatewayProxyEvent, APIGatewayProxyResult } from "commons/index";
import { responseBuilder } from "commons/index";
// import { User } from 'commons/model';

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;
  try {
    response = responseBuilder({ message: "hello world: Sumit" }, 200);
  } catch (err: unknown) {
    console.log(err);
    response = responseBuilder(
      { message: err instanceof Error ? err.message : "some error happened" },
      500,
    );
  }

  return response;
};
