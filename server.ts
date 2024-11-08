import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';

dotenv.config();

const port = process.env.PORT || 3001;
const apiKey = process.env.OPENAI_API_KEY;

// Check if the API key is defined
if (!apiKey) {
  console.error('OPENAI_API_KEY is not defined. Exiting...');
  process.exit(1);
}

const app = express();
app.use(express.json());

// TODO: Initialize the OpenAI model
const openai = new OpenAI({ apiKey });

// TODO: Define the parser for the structured output
const structuredOutputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    temperature: z.number(),
    weather: z.string(),
  })
);

// TODO: Get the format instructions from the parser
const formatInstructions = structuredOutputParser.getFormatInstructions();

// TODO: Define the prompt template
const promptTemplate = new PromptTemplate({
  template: 'What is the weather in {location}?',
  inputVariables: ['location'],
});

// Create a prompt function that takes the user input and passes it through the call method
async function promptFunc(input: string) {
  // TODO: Format the prompt with the user input
  // TODO: Call the model with the formatted prompt
  // TODO: return the JSON response
  // TODO: Catch any errors and log them to the console
  const formattedPrompt = await promptTemplate.format({ location: input });
  const response = JSON.parse(await openai.call(formattedPrompt)) as { choices: { text: string }[] };
  const parsedOutput = structuredOutputParser.parse(response.choices[0].text);
  return parsedOutput;

}

// Endpoint to handle request
app.post('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const location: string = req.body.location;
    if (!location) {
      res.status(400).json({
        error: 'Please provide a location in the request body.',
      });
    }
    const result: any = await promptFunc(location);
    res.json({ result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
