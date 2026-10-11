/** Log one part of a collated flow as soon as it finishes. */
export async function part(flowId, name, action) {
  try {
    await action();
    console.log(`PASS ${flowId} > ${name}`);
  } catch (error) {
    console.error(`FAIL ${flowId} > ${name}`);
    console.error(error.message);
    throw error;
  }
}
