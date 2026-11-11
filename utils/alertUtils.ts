// Short, themed alert messages for the app
export const alertMessages = {
  // Success messages
  success: {
    profileUpdated: 'Profile updated!',
    passwordChanged: 'Password changed!',
    scheduleCreated: 'Schedule created!',
    scheduleUpdated: 'Schedule updated!',
    scheduleDeleted: 'Schedule deleted!',
    geyserConnected: 'Geyser connected!',
    geyserRemoved: 'Geyser removed!',
    temperatureSet: 'Temperature set!',
    modeChanged: 'Mode changed!',
    deviceClaimed: 'Device claimed!',
    masterRegistered: 'Master registered!',
    qrEntered: 'QR code entered!',
    logoutSuccess: 'Logged out!',
    backgroundServiceStarted: 'Service started!',
    schedulesCancelled: 'Schedules cancelled!',
    scheduleCheckComplete: 'Check complete!',
  },

  // Error messages
  error: {
    generic: 'Something went wrong',
    networkError: 'Network error',
    invalidInput: 'Invalid input',
    deviceNotFound: 'Device not found',
    deviceNotConnected: 'No device connected',
    failedToUpdate: 'Update failed',
    failedToCreate: 'Creation failed',
    failedToDelete: 'Deletion failed',
    failedToLoad: 'Failed to load',
    failedToConnect: 'Connection failed',
    failedToClaim: 'Claim failed',
    failedToRegister: 'Registration failed',
    failedToLogout: 'Logout failed',
    failedToInitialize: 'Initialization failed',
    failedToCheck: 'Check failed',
    failedToCancel: 'Cancellation failed',
  },

  // Info messages
  info: {
    comingSoon: 'Coming soon',
    qrScanning: 'QR scanning will be available later',
    deviceAlreadyClaimed: 'Device is already claimed',
    modeAlreadySet: 'Mode is already set',
    scheduleEnabled: 'Schedule enabled',
    scheduleDisabled: 'Schedule disabled',
    backgroundServiceRunning: 'Background service is running',
    schedulesActive: 'Schedules are active',
  },

  // Warning messages
  warning: {
    incompleteForm: 'Please fill all fields',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    passwordMismatch: 'Passwords don\'t match',
    passwordTooShort: 'Password too short',
    temperatureRange: 'Temperature must be 30-100°C',
    requiredFields: 'All fields required',
    confirmAction: 'Are you sure?',
    logoutConfirm: 'Logout?',
    deleteConfirm: 'Delete this?',
    removeConfirm: 'Remove this?',
  },

  // Validation messages
  validation: {
    enterName: 'Enter your name',
    enterEmail: 'Enter your email',
    enterPhone: 'Enter your phone',
    enterPassword: 'Enter password',
    enterDeviceId: 'Enter device ID',
    enterGeyserId: 'Enter geyser ID',
    enterMessage: 'Enter your message',
    enterIdentifier: 'Enter identifier',
    enterTemperature: 'Enter temperature',
    enterScheduleName: 'Enter schedule name',
    enterScheduleTime: 'Enter schedule time',
    enterScheduleDuration: 'Enter duration',
  },

  // Action confirmations
  confirm: {
    logout: 'Logout?',
    delete: 'Delete?',
    remove: 'Remove?',
    cancel: 'Cancel?',
    overwrite: 'Overwrite?',
    replace: 'Replace?',
    clear: 'Clear all?',
    reset: 'Reset?',
    force: 'Force action?',
    emergency: 'Call emergency service?',
  },

  // Button texts
  buttons: {
    ok: 'OK',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    delete: 'Delete',
    remove: 'Remove',
    save: 'Save',
    update: 'Update',
    create: 'Create',
    enable: 'Enable',
    disable: 'Disable',
    retry: 'Retry',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    send: 'Send',
    call: 'Call',
  },
};

// Helper function to get short message
export const getShortMessage = (type: keyof typeof alertMessages, key: string): string => {
  const category = alertMessages[type];
  return category[key as keyof typeof category] || alertMessages.error.generic;
};

// Helper function to get button text
export const getButtonText = (key: string): string => {
  return alertMessages.buttons[key as keyof typeof alertMessages.buttons] || 'OK';
};
