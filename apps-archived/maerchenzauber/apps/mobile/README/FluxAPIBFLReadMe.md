0.0.1
OAS 3.1.0
BFL API
Download OpenAPI Document
Authorize with an API key from your user profile.

Server
Base URL
Selected:
https://api.bfl.ml

Authentication
Optional

APIKeyHeader
Name
:
x-key
Value
:
QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
Client Libraries
Curl Shell
Utility​#Copy link to "Utility"
These utility endpoints allow you to check the results of submitted tasks.

UtilityEndpoints
GET
/v1/get_result
Get Result​#Copy link to "Get Result"
An endpoint for getting generation task result.

Query Parameters
id
string
required
Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
GET
/v1/get_result
Selected HTTP client:Shell Curl

Curl
Copy content
curl 'https://api.bfl.ml/v1/get_result?id=' \
 --header 'X-Key: YOUR_SECRET_TOKEN'

Test Request
(GET /v1/get_result)
200
422
Copy content
{
"id": "…",
"status": "Task not found",
"result": {}
}
Successful Response

Tasks​#Copy link to "Tasks"
Generation task endpoints. These endpoints allow you to submit generation tasks.

TasksEndpoints
POST
/v1/flux-pro-1.1
POST
/v1/flux-pro
POST
/v1/flux-dev
POST
/v1/flux-pro-1.1-ultra
POST
/v1/flux-pro-1.0-fill
POST
/v1/flux-pro-1.0-canny
POST
/v1/flux-pro-1.0-depth
Generate an image with FLUX 1.1 [pro].​#Copy link to "Generate an image with FLUX 1.1 [pro]."
Submits an image generation task with FLUX 1.1 [pro].

Body
application/json
prompt
anyOf
Text prompt for image generation.

Example
ein fantastisches bild
Show Child Attributes
Show Child Attributes
image_prompt
anyOf
Optional base64 encoded image to use with Flux Redux.

Show Child Attributes
Show Child Attributes
width
integer
min:
256
max:
1440
default:
1024
Width of the generated image in pixels. Must be a multiple of 32.

height
integer
min:
256
max:
1440
default:
768
Height of the generated image in pixels. Must be a multiple of 32.

prompt_upsampling
boolean
default:
false
Whether to perform upsampling on the prompt. If active, automatically modifies the prompt for more creative generation.

seed
anyOf
Optional seed for reproducibility.

Example
42
Show Child Attributes
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Example
2
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-pro-1.1
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-pro-1.1 \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"prompt": "ein fantastisches bild",
"image_prompt": "",
"width": 1024,
"height": 768,
"prompt_upsampling": false,
"seed": 42,
"safety_tolerance": 2,
"output_format": "jpeg"
}'

Test Request
(POST /v1/flux-pro-1.1)
200
422
Copy content
{
"id": "…"
}
Successful Response

Generate an image with FLUX.1 [pro].​#Copy link to "Generate an image with FLUX.1 [pro]."
Submits an image generation task with the FLUX.1 [pro].

Body
application/json
prompt
anyOf
Text prompt for image generation.

Example
ein fantastisches bild
Show Child Attributes
Show Child Attributes
image_prompt
anyOf
Optional base64 encoded image to use as a prompt for generation.

Show Child Attributes
Show Child Attributes
width
integer
min:
256
max:
1440
default:
1024
Width of the generated image in pixels. Must be a multiple of 32.

height
integer
min:
256
max:
1440
default:
768
Height of the generated image in pixels. Must be a multiple of 32.

steps
anyOf
Number of steps for the image generation process.

Example
40
Show Child Attributes
Show Child Attributes
prompt_upsampling
boolean
default:
false
Whether to perform upsampling on the prompt. If active, automatically modifies the prompt for more creative generation.

seed
anyOf
Optional seed for reproducibility.

Example
42
Show Child Attributes
Show Child Attributes
guidance
anyOf
Guidance scale for image generation. High guidance scales improve prompt adherence at the cost of reduced realism.

Example
2.5
Show Child Attributes
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Example
2
interval
anyOf
Interval parameter for guidance control.

Example
2
Show Child Attributes
Show Child Attributes
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-pro
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-pro \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"prompt": "ein fantastisches bild",
"image_prompt": "",
"width": 1024,
"height": 768,
"steps": 40,
"prompt_upsampling": false,
"seed": 42,
"guidance": 2.5,
"safety_tolerance": 2,
"interval": 2,
"output_format": "jpeg"
}'

Test Request
(POST /v1/flux-pro)
200
422
Copy content
{
"id": "…"
}
Successful Response

Generate an image with FLUX.1 [dev].​#Copy link to "Generate an image with FLUX.1 [dev]."
Submits an image generation task with FLUX.1 [dev].

Body
application/json
prompt
string
default:
Text prompt for image generation.

Example
ein fantastisches bild
image_prompt
anyOf
Optional base64 encoded image to use as a prompt for generation.

Show Child Attributes
Show Child Attributes
width
integer
min:
256
max:
1440
default:
1024
Width of the generated image in pixels. Must be a multiple of 32.

height
integer
min:
256
max:
1440
default:
768
Height of the generated image in pixels. Must be a multiple of 32.

steps
anyOf
Number of steps for the image generation process.

Example
28
Show Child Attributes
Show Child Attributes
prompt_upsampling
boolean
default:
false
Whether to perform upsampling on the prompt. If active, automatically modifies the prompt for more creative generation.

seed
anyOf
Optional seed for reproducibility.

Example
42
Show Child Attributes
Show Child Attributes
guidance
anyOf
Guidance scale for image generation. High guidance scales improve prompt adherence at the cost of reduced realism.

Example
3
Show Child Attributes
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Example
2
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-dev
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-dev \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"prompt": "ein fantastisches bild",
"image_prompt": "",
"width": 1024,
"height": 768,
"steps": 28,
"prompt_upsampling": false,
"seed": 42,
"guidance": 3,
"safety_tolerance": 2,
"output_format": "jpeg"
}'

Test Request
(POST /v1/flux-dev)
200
422
Copy content
{
"id": "…"
}
Successful Response

Generate an image with FLUX 1.1 [pro] with ultra mode and optional raw mode.​#Copy link to "Generate an image with FLUX 1.1 [pro] with ultra mode and optional raw mode."
Submits an image generation task with FLUX 1.1 [pro] with ultra mode and optional raw mode.

Body
application/json
prompt
anyOf
The prompt to use for image generation.

Example
A beautiful landscape with mountains and a lake
Show Child Attributes
Show Child Attributes
seed
anyOf
Optional seed for reproducibility. If not provided, a random seed will be used.

Example
42
Show Child Attributes
Show Child Attributes
aspect_ratio
string
default:
16:9
Aspect ratio of the image between 21:9 and 9:21

safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Example
2
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
raw
boolean
default:
false
Generate less processed, more natural-looking images

image_prompt
anyOf
Optional image to remix in base64 format

Show Child Attributes
Show Child Attributes
image_prompt_strength
number
min:
0
max:
1
default:
0.1
Blend between the prompt and the image prompt

Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-pro-1.1-ultra
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-pro-1.1-ultra \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"prompt": "A beautiful landscape with mountains and a lake",
"seed": 42,
"aspect_ratio": "16:9",
"safety_tolerance": 2,
"output_format": "jpeg",
"raw": false,
"image_prompt": "",
"image_prompt_strength": 0.1
}'

Test Request
(POST /v1/flux-pro-1.1-ultra)
200
422
null
Successful Response

Generate an image with FLUX.1 Fill [pro] using an input image and mask.​#Copy link to "Generate an image with FLUX.1 Fill [pro] using an input image and mask."
Submits an image generation task with the FLUX.1 Fill [pro] model using an input image and mask. Mask can be applied to alpha channel or submitted as a separate image.

Body
application/json
image
string
required
A Base64-encoded string representing the image you wish to modify. Can contain alpha mask if desired.

mask
anyOf
A Base64-encoded string representing a mask for the areas you want to modify in the image. The mask should be the same dimensions as the image and in black and white. Black areas (0%) indicate no modification, while white areas (100%) specify areas for inpainting. Optional if you provide an alpha mask in the original image. Validation: The endpoint verifies that the dimensions of the mask match the original image.

Show Child Attributes
Show Child Attributes
prompt
anyOf
The description of the changes you want to make. This text guides the inpainting process, allowing you to specify features, styles, or modifications for the masked area.

Example
ein fantastisches bild
Show Child Attributes
Show Child Attributes
steps
anyOf
Number of steps for the image generation process

Example
50
Show Child Attributes
Show Child Attributes
prompt_upsampling
anyOf
Whether to perform upsampling on the prompt. If active, automatically modifies the prompt for more creative generation

Show Child Attributes
Show Child Attributes
seed
anyOf
Optional seed for reproducibility

Show Child Attributes
Show Child Attributes
guidance
anyOf
Guidance strength for the image generation process

Show Child Attributes
Show Child Attributes
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Example
2
Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-pro-1.0-fill
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-pro-1.0-fill \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"image": "",
"mask": "",
"prompt": "ein fantastisches bild",
"steps": 50,
"prompt_upsampling": false,
"seed": 1,
"guidance": 60,
"output_format": "jpeg",
"safety_tolerance": 2
}'

Test Request
(POST /v1/flux-pro-1.0-fill)
200
422
Copy content
{
"id": "…"
}
Successful Response

Generate an image with FLUX.1 Canny [pro] using a control image.​#Copy link to "Generate an image with FLUX.1 Canny [pro] using a control image."
Submits an image generation task with FLUX.1 Canny [pro].

Body
application/json
prompt
string
required
Text prompt for image generation

Example
ein fantastisches bild
control_image
string
required
Base64 encoded image to use as control input

prompt_upsampling
anyOf
Whether to perform upsampling on the prompt

Show Child Attributes
Show Child Attributes
seed
anyOf
Optional seed for reproducibility

Example
42
Show Child Attributes
Show Child Attributes
steps
anyOf
Number of steps for the image generation process

Show Child Attributes
Show Child Attributes
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
guidance
anyOf
Guidance strength for the image generation process

Show Child Attributes
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
application/json
POST
/v1/flux-pro-1.0-canny
Selected HTTP client:Shell Curl

Curl
Copy content
curl https://api.bfl.ml/v1/flux-pro-1.0-canny \
 --request POST \
 --header 'Content-Type: application/json' \
 --header 'X-Key: YOUR_SECRET_TOKEN' \
 --data '{
"prompt": "ein fantastisches bild",
"control_image": "",
"prompt_upsampling": false,
"seed": 42,
"steps": 50,
"output_format": "jpeg",
"guidance": 30,
"safety_tolerance": 2
}'

Test Request
(POST /v1/flux-pro-1.0-canny)
200
422
null
Successful Response

Generate an image with FLUX.1 Depth [pro] using a control image.​#Copy link to "Generate an image with FLUX.1 Depth [pro] using a control image."
Submits an image generation task with FLUX.1 Depth [pro].

Body
application/json
prompt
string
required
Text prompt for image generation

Example
ein fantastisches bild
control_image
string
required
Base64 encoded image to use as control input

prompt_upsampling
anyOf
Whether to perform upsampling on the prompt

Show Child Attributes
Show Child Attributes
seed
anyOf
Optional seed for reproducibility

Example
42
Show Child Attributes
Show Child Attributes
steps
anyOf
Number of steps for the image generation process

Show Child Attributes
Show Child Attributes
output_format
anyOf
Output format for the generated image. Can be 'jpeg' or 'png'.

Show OutputFormat
Show Child Attributes
guidance
anyOf
Guidance strength for the image generation process

Show Child Attributes
Show Child Attributes
safety_tolerance
integer
min:
0
max:
6
default:
2
Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.

Responses
Expand
200
Successful Response
application/json
Expand
422
Validation Error
