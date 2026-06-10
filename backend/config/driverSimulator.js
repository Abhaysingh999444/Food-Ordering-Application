import { dbService } from './dbService.js';

// Dictionary to keep track of active simulation intervals so they can be cleared if needed
const activeSimulations = new Map();

/**
 * Simulates a driver driving from start (restaurant) to end (customer) location.
 * Pushes real-time coordinate updates to the client via Socket.io.
 */
export const startDriverSimulation = (io, orderId, startCoords, endCoords) => {
  // If there is an existing simulation for this order, clear it
  if (activeSimulations.has(orderId)) {
    clearInterval(activeSimulations.get(orderId));
  }

  let currentStep = 0;
  const totalSteps = 15; // Number of steps for the driver journey
  
  const latDelta = (endCoords.lat - startCoords.lat) / totalSteps;
  const lngDelta = (endCoords.lng - startCoords.lng) / totalSteps;

  const intervalId = setInterval(async () => {
    currentStep++;
    
    // Calculate new simulated driver position
    const currentLat = startCoords.lat + (latDelta * currentStep);
    const currentLng = startCoords.lng + (lngDelta * currentStep);
    const driverLocation = { lat: currentLat, lng: currentLng };

    try {
      // 1. Update the driver location in database
      const order = await dbService.orders.findByIdAndUpdate(orderId, { driverLocation });

      // 2. Emit the updated coordinates via Socket.io room
      io.to(`order_${orderId}`).emit('driver_location_update', {
        orderId,
        driverLocation
      });

      console.log(`Order ${orderId} - Driver position: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} (Step ${currentStep}/${totalSteps})`);

      // 3. If driver reached the destination, complete order
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        activeSimulations.delete(orderId);

        // Update status to Delivered
        const finalOrder = await dbService.orders.findByIdAndUpdate(orderId, { 
          status: 'Delivered',
          driverLocation: endCoords
        });

        // Emit final status update
        io.to(`order_${orderId}`).emit('order_status_update', {
          orderId,
          status: 'Delivered',
          order: finalOrder
        });

        console.log(`Order ${orderId} - Delivered successfully.`);
      }
    } catch (err) {
      console.error(`Error in driver simulation for order ${orderId}:`, err.message);
      clearInterval(intervalId);
      activeSimulations.delete(orderId);
    }
  }, 2500); // Update every 2.5 seconds

  activeSimulations.set(orderId, intervalId);
};
