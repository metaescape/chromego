function isTimeInAllowedRange() {
  const now = new Date();
  const currentHour = now.getHours();
  return true; // Always return true for now
}

export { isTimeInAllowedRange };
