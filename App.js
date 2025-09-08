// App.js
import 'react-native-gesture-handler'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from './UserContext';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import screens
import SignInScreen from './screens/SignInScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import UploadTakeoutScreen from './screens/UploadTakeoutScreen';
// NOTE: CommentScreen and WordCloudScreen are no longer imported

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function MainAppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home" // Set Home as the default tab
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#222' },
        tabBarActiveTintColor: '#FF0000',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{ headerShown: false }} 
            initialRouteName="SignIn"
          >
            {/* Screens outside the tab navigator */}
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="UploadTakeout" component={UploadTakeoutScreen}/>

            {/* The entry point for the main app experience */}
            <Stack.Screen name="MainApp" component={MainAppTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </GestureHandlerRootView>
  );
}