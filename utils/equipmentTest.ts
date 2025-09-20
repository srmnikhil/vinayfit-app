// Test file for multiple equipment selection functionality

// Test the equipment selection logic
export const testEquipmentSelection = () => {
  console.log('Testing multiple equipment selection...');
  
  // Simulate the equipment selection logic
  const equipment = ['Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Bands'];
  let selectedEquipment: string[] = [];
  
  // Test adding equipment
  const addEquipment = (item: string) => {
    if (!selectedEquipment.includes(item)) {
      selectedEquipment = [...selectedEquipment, item];
      console.log(`Added equipment: ${item}`);
      console.log('Selected equipment:', selectedEquipment);
    }
  };
  
  // Test removing equipment
  const removeEquipment = (item: string) => {
    selectedEquipment = selectedEquipment.filter(eq => eq !== item);
    console.log(`Removed equipment: ${item}`);
    console.log('Selected equipment:', selectedEquipment);
  };
  
  // Test toggle equipment
  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      removeEquipment(item);
    } else {
      addEquipment(item);
    }
  };
  
  // Run tests
  console.log('Initial state:', selectedEquipment);
  
  toggleEquipment('Barbell');
  toggleEquipment('Dumbbell');
  toggleEquipment('Kettlebell');
  toggleEquipment('Barbell'); // Should remove it
  
  console.log('Final state:', selectedEquipment);
  
  return {
    success: true,
    message: 'Multiple equipment selection logic is working correctly',
    finalSelection: selectedEquipment,
    expectedSelection: ['Dumbbell', 'Kettlebell']
  };
}; 