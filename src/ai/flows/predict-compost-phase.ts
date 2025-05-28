// src/ai/flows/predict-compost-phase.ts
'use server';

/**
 * @fileOverview Predicts the current phase of the compost and estimates the time remaining until it's ready.
 *
 * - predictCompostPhase - A function that handles the compost phase prediction process.
 * - PredictCompostPhaseInput - The input type for the predictCompostPhase function.
 * - PredictCompostPhaseOutput - The return type for the predictCompostPhase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictCompostPhaseInputSchema = z.object({
  startDate: z
    .string()
    .describe('The start date of the composting process (ISO format).'),
  currentDate: z
    .string()
    .describe('The current date for phase prediction (ISO format).'),
  temperatureReadings: z
    .array(z.number())
    .describe('An array of temperature readings in Celsius.'),
  humidityReadings: z
    .array(z.number())
    .describe('An array of humidity readings in percentage.'),
  phReadings: z
    .array(z.number())
    .optional()
    .describe('An optional array of pH readings.'),
  electricalConductivityReadings: z
    .array(z.number())
    .optional()
    .describe('An optional array of electrical conductivity readings in dS/m.'),
});
export type PredictCompostPhaseInput = z.infer<typeof PredictCompostPhaseInputSchema>;

const PredictCompostPhaseOutputSchema = z.object({
  phase: z.string().describe('The predicted phase of the compost.'),
  daysElapsed: z.number().describe('The number of days elapsed since the start date.'),
  estimatedDaysRemaining: z
    .number()
    .describe('The estimated number of days remaining until the compost is ready.'),
  recommendations: z.string().describe('AI-driven recommendations for the current phase.'),
});
export type PredictCompostPhaseOutput = z.infer<typeof PredictCompostPhaseOutputSchema>;

export async function predictCompostPhase(input: PredictCompostPhaseInput): Promise<PredictCompostPhaseOutput> {
  return predictCompostPhaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictCompostPhasePrompt',
  input: {schema: PredictCompostPhaseInputSchema},
  output: {schema: PredictCompostPhaseOutputSchema},
  prompt: `You are an expert in composting and can accurately predict the phase of compost based on the provided data and provide helpful recommendations.

  Start Date: {{{startDate}}}
  Current Date: {{{currentDate}}}
  Temperature Readings (Celsius): {{{temperatureReadings}}}
  Humidity Readings (Percentage): {{{humidityReadings}}}
  pH Readings (Optional): {{{phReadings}}}
  Electrical Conductivity Readings (Optional): {{{electricalConductivityReadings}}}

  Based on this data, predict the current phase of the compost, estimate the number of days remaining until it is ready, and provide recommendations to the user.

  Ensure your output is well-formatted and easy to understand.
`,
});

const predictCompostPhaseFlow = ai.defineFlow(
  {
    name: 'predictCompostPhaseFlow',
    inputSchema: PredictCompostPhaseInputSchema,
    outputSchema: PredictCompostPhaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
