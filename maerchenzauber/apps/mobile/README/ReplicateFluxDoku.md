
# HTTP Infos:
Playground
API
Examples
README
Table of Contents


HTTP
Get started
Learn more
Schema
API reference
Use one of our client libraries to get started quickly.


Node.js

Python

HTTP
Set the MAERCHENZAUBER_REPLICATE_API_KEY environment variable

export MAERCHENZAUBER_REPLICATE_API_KEY=ed9404**********************************

Visibility

Copy
Learn more about authentication

Run black-forest-labs/flux-schnell using Replicate’s API. Check out the model's schema for an overview of inputs and outputs.

curl --silent --show-error https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions \
	--request POST \
	--header "Authorization: Bearer $MAERCHENZAUBER_REPLICATE_API_KEY" \
	--header "Content-Type: application/json" \
	--header "Prefer: wait" \
	--data @- <<'EOM'
{
	"input": {
      "prompt": "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
	}
}
EOM

Copy
Learn more


# Node Infos
black-forest-labs / flux-schnell 

Use one of our client libraries to get started quickly.

Node.js

Python

HTTP
Set the MAERCHENZAUBER_REPLICATE_API_KEY environment variable

export MAERCHENZAUBER_REPLICATE_API_KEY=ed9404**********************************

Visibility

Copy
Learn more about authentication

Install Replicate’s Node.js client library

npm install replicate

Copy
Learn more about setup
Run black-forest-labs/flux-schnell using Replicate’s API. Check out the model's schema for an overview of inputs and outputs.

import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    prompt: "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
};

const output = await replicate.run("black-forest-labs/flux-schnell", { input });

import { writeFile } from "node:fs/promises";
for (const [index, item] of Object.entries(output)) {
  await writeFile(`output_${index}.webp`, item);
}
//=> output_0.webp written to disk

Copy
Learn more

Authentication
Whenever you make an API request, you need to authenticate using a token. A token is like a password that uniquely identifies your account and grants you access.

The following examples all expect your Replicate access token to be available from the command line. Because tokens are secrets, they should not be in your code. They should instead be stored in environment variables. Replicate clients look for the MAERCHENZAUBER_REPLICATE_API_KEY environment variable and use it if available.

To set this up you can use:

export MAERCHENZAUBER_REPLICATE_API_KEY=ed9404**********************************

Visibility

Copy
Some application frameworks and tools also support a text file named .env which you can edit to include the same token:

MAERCHENZAUBER_REPLICATE_API_KEY=ed9404**********************************

Visibility

Copy
The Replicate API uses the Authorization HTTP header to authenticate requests. If you’re using a client library this is handled for you.

You can test that your access token is setup correctly by using our account.get endpoint:

What is cURL?
curl https://api.replicate.com/v1/account -H "Authorization: Bearer $MAERCHENZAUBER_REPLICATE_API_KEY"
# {"type":"user","username":"aron","name":"Aron Carroll","github_url":"https://github.com/aron"}

Copy
If it is working correctly you will see a JSON object returned containing some information about your account, otherwise ensure that your token is available:

echo "$MAERCHENZAUBER_REPLICATE_API_KEY"
# "r8_xyz"

Copy
Setup
NodeJS supports two module formats ESM and CommonJS. Below details the setup for each environment. After setup, the code is identical regardless of module format.

ESM
First you’ll need to ensure you have a NodeJS project:

npm create esm -y

Copy
Then install the replicate JavaScript library using npm:

npm install replicate

Copy
To use the library, first import and create an instance of it:

import Replicate from "replicate";

const replicate = new Replicate();

Copy
This will use the MAERCHENZAUBER_REPLICATE_API_KEY API token you’ve setup in your environment for authorization.

CommonJS
First you’ll need to ensure you have a NodeJS project:

npm create -y

Copy
Then install the replicate JavaScript library using npm:

npm install replicate

Copy
To use the library, first import and create an instance of it:

const Replicate = require("replicate");

const replicate = new Replicate();

Copy
This will use the MAERCHENZAUBER_REPLICATE_API_KEY API token you’ve setup in your environment for authorization.

Run the model
Use the replicate.run() method to run the model:

const input = {
    prompt: "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
};

const output = await replicate.run("black-forest-labs/flux-schnell", { input });

import { writeFile } from "node:fs/promises";
for (const [index, item] of Object.entries(output)) {
  await writeFile(`output_${index}.webp`, item);
}
//=> output_0.webp written to disk

Copy
You can learn about pricing for this model on the model page.

The run() function returns the output directly, which you can then use or pass as the input to another model. If you want to access the full prediction object (not just the output), use the replicate.predictions.create() method instead. This will include the prediction id, status, logs, etc.

Prediction lifecycle
Running predictions and trainings can often take significant time to complete, beyond what is reasonable for an HTTP request/response.

When you run a model on Replicate, the prediction is created with a “starting” state, then instantly returned. This will then move to "processing" and eventual one of “successful”, "failed" or "canceled".

Starting
Running
Succeeded
Failed
Canceled
You can explore the prediction lifecycle by using the predictions.get() method to retrieve the latest version of the prediction until completed.

Show example
Webhooks
Webhooks provide real-time updates about your prediction. Specify an endpoint when you create a prediction, and Replicate will send HTTP POST requests to that URL when the prediction is created, updated, and finished.

It is possible to provide a URL to the predictions.create() function that will be requested by Replicate when the prediction status changes. This is an alternative to polling.

To receive webhooks you’ll need a web server. The following example uses Hono, a web standards based server, but this pattern applies to most frameworks.

Show example
Then create the prediction passing in the webhook URL and specify which events you want to receive out of "start", "output", ”logs” and "completed".

const input = {
    prompt: "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
};

const callbackURL = `https://my.app/webhooks/replicate`;
await replicate.predictions.create({
  model: "black-forest-labs/flux-schnell",
  input: input,
  webhook: callbackURL,
  webhook_events_filter: ["completed"],
});

// The server will now handle the event and log:
// => {"id": "xyz", "status": "successful", ... }

Copy
ℹ️ The replicate.run() method is not used here. Because we're using webhooks, and we don’t need to poll for updates.

Co-ordinating between a prediction request and a webhook response will require some glue. A simple implementation for a single JavaScript server could use an event emitter to manage this.

Show example
From a security perspective it is also possible to verify that the webhook came from Replicate. Check out our documentation on verifying webhooks for more information.

Access a prediction
You may wish to access the prediction object. In these cases it’s easier to use the replicate.predictions.create() or replicate.deployments.predictions.create() functions which will return the prediction object.

Though note that these functions will only return the created prediction, and it will not wait for that prediction to be completed before returning. Use replicate.predictions.get() to fetch the latest prediction.

const input = {
    prompt: "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
};
const prediction = replicate.predictions.create({
  model: "black-forest-labs/flux-schnell",
  input
});
// { "id": "xyz123", "status": "starting", ... }

Copy
Cancel a prediction
You may need to cancel a prediction. Perhaps the user has navigated away from the browser or canceled your application. To prevent unnecessary work and reduce runtime costs you can use the replicate.predictions.cancel function and pass it a prediction id.

await replicate.predictions.cancel(prediction.id);

Input schema
Table
JSON
seed
integer
Random seed. Set for reproducible generation

prompt
string
Prompt for generated image

go_fast
boolean
Run faster predictions with model optimized for speed (currently fp8 quantized); disable to run in original bf16

Default
true
megapixels
string
Approximate number of megapixels for generated image

Default
"1"
num_outputs
integer
Number of outputs to generate

Default
1
Minimum
1
Maximum
4
aspect_ratio
string
Aspect ratio for the generated image

Default
"1:1"
output_format
string
Format of the output images

Default
"webp"
output_quality
integer
Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs

Default
80
Maximum
100
num_inference_steps
integer
Number of denoising steps. 4 is recommended, and lower number of steps produce lower quality outputs, faster.

Default
4
Minimum
1
Maximum
4
disable_safety_checker
boolean
Disable safety checker for generated images.

Output schema
Table
JSON
Type
uri[]


# Input schema

Table
JSON
seed
integer
Random seed. Set for reproducible generation

prompt
string
Prompt for generated image

go_fast
boolean
Run faster predictions with model optimized for speed (currently fp8 quantized); disable to run in original bf16

Default
true
megapixels
string
Approximate number of megapixels for generated image

Default
"1"
num_outputs
integer
Number of outputs to generate

Default
1
Minimum
1
Maximum
4
aspect_ratio
string
Aspect ratio for the generated image

Default
"1:1"
output_format
string
Format of the output images

Default
"webp"
output_quality
integer
Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs

Default
80
Maximum
100
num_inference_steps
integer
Number of denoising steps. 4 is recommended, and lower number of steps produce lower quality outputs, faster.

Default
4
Minimum
1
Maximum
4
disable_safety_checker
boolean
Disable safety checker for generated images.

Output schema
Table
JSON
Type
uri[]