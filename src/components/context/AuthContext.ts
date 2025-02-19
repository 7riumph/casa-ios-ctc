import AsyncStorage from '@react-native-async-storage/async-storage';
import routeRequest from 'src/authBase/routeRequest';

import createDataContext from './createDataContext';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'signin':
      return { ...state, isSignedIn: true, token: action.payload.token, user: action.payload.user };
    case 'signout':
      return { ...state, isSignedIn: false, token: null };
    case 'update_user':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

const updateUser = (dispatch) => async (newUserData) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(newUserData));
    dispatch({ type: 'update_user', payload: newUserData });
  } catch (err) {
    console.error('Error updating user data:', err);
  }
};

const signin = (dispatch) => async (email, password, staySignedIn) => {
  const data = await routeRequest('/api/v1/users/sign_in', { email, password }); // Sign-in first
  const { id, display_name, userEmail, token } = data;
  if (token) {
    try {
      if (staySignedIn) {
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('user', JSON.stringify({ id, display_name, email }));
        console.log('User data stored in AsyncStorage' + ' Hello ' + display_name);
      }
      dispatch({
        type: 'signin',
        payload: { token, user: { id, display_name, email } },
      });
    } catch (storageError) {
      console.error('Error storing data in AsyncStorage:', storageError);
    }
  } else {
    console.error('Sign-in failed, not storing data');
  }
};

const signout = (dispatch) => async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    dispatch({ type: 'signout' });
  } catch (err) {
    console.error('Error during signout:', err);
  }
};

const tryLocalSignin = (dispatch) => async () => {
  const token = await AsyncStorage.getItem('auth_token');
  const user = await AsyncStorage.getItem('user');

  console.log(token);
  console.log(user);

  if (token && user) {
    dispatch({ type: 'signin', payload: { token, user: JSON.parse(user) } });
  } else {
    dispatch({ type: 'signout' });
  }
};

export const { Provider, Context } = createDataContext(
  authReducer,
  { signin, signout, updateUser, tryLocalSignin },
  { isSignedIn: false, token: null, user: null }
);
