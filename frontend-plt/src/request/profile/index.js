import { getApi, putApi, postApi, post } from '../index.js';

export const profileAPI = {
  // Get current user profile
  getProfile: () => {
    return getApi('/users/profile/me');
  },

  // Update user profile
  updateProfile: (profileData) => {
    return putApi('/users/profile/me', profileData);
  },

  // Change password
  changePassword: (passwordData) => {
    return putApi('/users/profile/change-password', passwordData);
  },

  // Upload avatar using the same logic as store
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await post('/upload/avatars', formData, {
        'Content-Type': 'multipart/form-data',
      });

      let imageUrl;
      if (response.data && response.data.url) {
        imageUrl = response.data.url;
      } else {
        throw new Error('Avatar upload failed');
      }

      return { avatar: imageUrl };
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }
};
