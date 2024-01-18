function generateRandomOrderId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8; // You can adjust the length as needed
  let orderId = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    orderId += characters.charAt(randomIndex);
  }

  return orderId;
}

// Example usage
const randomOrderId = generateRandomOrderId();
console.log(randomOrderId);
