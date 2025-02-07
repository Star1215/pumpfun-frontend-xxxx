async function retryFunction(fn, maxRetries = 3, retryDelay = 2000) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        console.error('Max retries reached. Returning undefined.', error);
        return undefined;
      }
      console.warn(`Attempt ${attempts} failed. Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export { retryFunction };
