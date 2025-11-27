sing Firebase

A guide on getting started and using Firebase JS SDK and React Native Firebase library.

Firebase is a Backend-as-a-Service (BaaS) app development platform that provides hosted backend services such as real-time database, cloud storage, authentication, crash reporting, analytics, and so on. It is built on Google's infrastructure and scales automatically.

There are two different ways you can use Firebase in your projects:

Using Firebase JS SDK
Using React Native Firebase
React Native supports both the JS SDK and the native SDK. The following sections will guide you through when to use which SDK and all the configuration steps required to use Firebase in your Expo projects.

Prerequisites
Before proceeding, make sure that you have created a new Firebase project or have an existing one using the Firebase console.

Using Firebase JS SDK
The Firebase JS SDK is a JavaScript library that allows you to interact with Firebase services in your project. It supports services such as Authentication, Firestore, Realtime Database, and Storage in a React Native app.

When to use Firebase JS SDK
You can consider using the Firebase JS SDK when you:

Want to use Firebase services such as Authentication, Firestore, Realtime Database, and Storage in your app and want to develop your app with Expo Go.
Want a quick start with Firebase services.
Want to create a universal app for Android, iOS, and the web.
Caveats
Firebase JS SDK does not support all services for mobile apps. Some of these services are Analytics, Dynamic Links and Crashlytics. See the React Native Firebase section if you want to use these services.

Install and initialize Firebase JS SDK
The following sub-sections use firebase@9.x.x. Expo SDK does not enforce or recommend any specific version of Firebase to use in your app.

If you are using an older version of the firebase library in your project, you may have to adapt the code examples to match the version that you are using with the help of the Firebase JS SDK documentation.

1

Install the SDK
After you have created your Expo project, you can install the Firebase JS SDK using the following command:

Terminal

Copy

npx expo install firebase
2

Initialize the SDK in your project
To initialize the Firebase instance in your Expo project, you must create a config object and pass it to the initializeApp() method imported from the firebase/app module.

The config object requires an API key and other unique identifiers. To obtain these values, you will have to register a web app in your Firebase project. You can find these instructions in the Firebase documentation.

After you have the API key and other identifiers, you can paste the following code snippet by creating a new firebaseConfig.js file in your project's root directory or any other directory where you keep the configuration files.

firebaseConfig.js

Copy

import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
// import {...} from "firebase/auth";
// import {...} from "firebase/database";
// import {...} from "firebase/firestore";
// import {...} from "firebase/functions";
// import {...} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
apiKey: 'api-key',
authDomain: 'project-id.firebaseapp.com',
databaseURL: 'https://project-id.firebaseio.com',
projectId: 'project-id',
storageBucket: 'project-id.appspot.com',
messagingSenderId: 'sender-id',
appId: 'app-id',
measurementId: 'G-measurement-id',
};

const app = initializeApp(firebaseConfig);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase

Show More
You do not have to install other plugins or configurations to use Firebase JS SDK.

Firebase version 9 and above provide a modular API. You can directly import any service you want to use from the firebase package. For example, if you want to use an authentication service in your project, you can import the auth module from the firebase/auth package.

Troubleshooting tip: If you encounter issues related to authentication persistence with Firebase JS SDK, see the guide for setting up persistence to keep users logged in between reloads.
3

Configure Metro
If you are using Firebase version 9.7.x and above, you need to add the following configuration to a metro.config.js file to make sure that the Firebase JS SDK is bundled correctly.
Expo CLI uses Metro to bundle your JavaScript code and assets, and add support for more file extensions.

Start by generating the template file metro.config.js in your project's root directory using the following command:

Terminal

Copy

npx expo customize metro.config.js
Then, update the file with the following configuration:

metro.config.js

Copy

const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(\_\_dirname);
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = defaultConfig;
Next steps
Authentication
For more information on how to use Authentication in your project, see Firebase documentation.

Firestore
For more information on how to use Firestore database in your project, see Firebase documentation.

Realtime Database
For more information on how to use Realtime Database in your project, see Firebase documentation.

Storage
For more information on how to use Storage, see Firebase documentation.

Firebase Storage example
Learn how to use Firebase Storage in an Expo project with our example.

Managing API keys for Firebase projects
For more information about managing API Key and unique identifiers in a Firebase project.

Migrate from Expo Firebase packages to React Native Firebase
For more information on migrating from expo-firebase-analytics or expo-firebase-recaptcha packages to React Native Firebase.

Using React Native Firebase
React Native Firebase provides access to native code by wrapping the native SDKs for Android and iOS into a JavaScript API. Each Firebase service is available as a module that can be added as a dependency to your project. For example, the auth module provides access to the Firebase Authentication service.

When to use React Native Firebase
You can consider using React Native Firebase when:

Your app requires access to Firebase services not supported by the Firebase JS SDK, such as Dynamic Links, Crashlytics, and so on. For more information on the additional capabilities offered by the native SDK's, see React Native Firebase documentation.
You want to use native SDKs in your app.
You have a bare React Native app with React Native Firebase already configured but are migrating to use Expo SDK.
You want to use Firebase Analytics in your app.
Migrating from Expo Firebase packages?
Caveats
React Native Firebase requires custom native code and cannot be used with Expo Go.

Install and initialize React Native Firebase
1

Install expo-dev-client
Since React Native Firebase requires custom native code, you need to install the expo-dev-client library in your project. It also allows configuring any native code required by React Native Firebase using Config plugins without writing native code yourself.

To install expo-dev-client, run the following command in your project:

Terminal

Copy

npx expo install expo-dev-client
2

Install React Native Firebase
To use React Native Firebase, it is necessary to install the @react-native-firebase/app module. This module provides the core functionality for all other modules. It also adds custom native code in your project using a config plugin. You can install it using the following command:

Terminal

Copy

npx expo install @react-native-firebase/app
At this point, you must follow the instructions from React Native Firebase documentation as it covers all the steps required to configure your project with the library.

Once you have configured the React Native Firebase library in your project, come back to this guide to learn how to run your project in the next step.

3

Run the project
If you are using EAS Build, you can create and install a development build on your devices. You do not need to run the project locally before creating a development build. For more information on creating a development build, see the section on installing a development build.

Run project locally?
Next steps
After configuring React Native Firebase library, you can use any module it provides in your Expo project.
