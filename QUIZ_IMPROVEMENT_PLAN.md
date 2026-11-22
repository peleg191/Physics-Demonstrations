# Quiz improvement plan

Improve the learner’s ability to make a prediction, compare experimental evidence, and explain the physical relationship behind the result. Pilot the changes in Pascal’s law and the widening downhill pipe before applying them across Fluids and Mechanics.

## 1. Make experiment comparisons easy to read

- **Predict.** Ask about one measured quantity at a time and state what changes and what stays fixed. For example, ask how doubling the load piston cross-sectional area $A_2$ affects the upward liquid force $F_2$ when the input force $F_1$ and input piston cross-sectional area $A_1$ stay fixed.
- **Observe.** Show setups A and B in a compact comparison table. Include the changed parameter, its value and unit, and the measured result for each setup. Fill in a result after its setup runs.
- **Explain.** Keep the learner’s prediction and both results visible alongside the explanation question. Let learners rerun either setup from this step.

Use Pascal’s law to check whether learners can distinguish added liquid pressure from the upward force on the load piston. Use the widening downhill pipe to check whether they can distinguish the effects of widening and descending.

## 2. Give feedback that helps learners revise their reasoning

- Write feedback for common wrong answers. If a learner predicts that doubling $A_2$ doubles the added liquid pressure $\Delta p$, point them to the input force $F_1$ and input piston cross-sectional area $A_1$, which determine the pressure increment.
- Offer one focused hint and a retry. Direct attention to a specific measurement, diagram feature, or equation.
- Follow the explanation with a short transfer question. After asking what happens when $A_2$ doubles, ask what would happen if $A_1$ doubled instead.

## 3. Keep the quiz usable during the simulation

- Keep the current question and **Run A** and **Run B** controls within reach on mobile. Place the comparison directly below the canvas.
- Preserve the selected answer and recorded results when learners return from the canvas. Clearly mark which setups have run and which results are available.
- Verify narrow-screen English and Hebrew layouts, including inline LaTeX, units, and the reading order of setup A and setup B. Check that the full flow works with a keyboard.

## 4. Guide learners toward a useful next question

At the end of the quiz, summarize the concepts the learner practiced and suggest a targeted next question. For example, “You used Pascal’s law to compare forces. Try a question about how far each piston travels.” Keep the achievement display as a record of progress and use the quiz summary to guide the next learning step.

## First release and validation

Build the A/B comparison and targeted feedback for the two pilot demos first. Ask learners to complete a challenge on a phone and explain their answer using the displayed results. The pilot succeeds when learners can identify what changed, find both measurements, and explain the outcome without reopening either setup.
