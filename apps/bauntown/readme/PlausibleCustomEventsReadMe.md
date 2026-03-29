Custom events
note
If you use the custom events feature, then these count towards your billable monthly pageviews.

Custom events allow you to measure button clicks, purchases, subscription signups, form completions and pretty much any other action that you wish your visitors to take.

"Custom events" is an optional enhanced measurement that's not included in our default script. This is because we want to keep the default script as simple and lightweight as possible. If you want to track custom events, here's how to enable it:

Step 1: Enable "Custom events" for your site
You can enable "Custom events" as an optional measurement when adding a new site to your Plausible account. If the site has already been added to your account, you can control what data is collected in the "Site Installation" area of the "General" section in your site settings.

Enable custom events tracking during onboarding
Step 2: Change the snippet on your site
The tracking snippet changes depending on your selection of optional measurements. When making changes to your optional measurements, do ensure to insert the newest snippet into your site for all tracking to work as expected.

Your Plausible tracking snippet should be inserted into the Header (<head>) section of your site. Place the tracking script within the <head> … </head> tags.

Using WordPress?
The quickest way to start tracking custom events is to use our official WordPress plugin

Step 3: Add a CSS class name to the element you want to track on your site
Use pageview goals to track the "thank you" page or the order confirmation page
As an alternative to custom events, check out the pageview goals. Since pageviews are collected automatically, you don’t need to change your website’s code to measure pageview goals. This makes pageview goals the easiest way to start tracking any type of conversions.

Tag the site element you want to track with a CSS class name. How to do this varies depending on the site builder, CMS or framework you've used to build your site.

For instance, if you're using WordPress, you can click on any block element you want to track such as a button or a form. This will open up the block menu on the right-hand side of your screen.

Click on any WordPress block element you want to track such as a button or a form
You can then click on "Advanced" and add a CSS class name in the "Additional CSS class(es)" field. Add the CSS class name in this format: plausible-event-name=MyEventName. For instance, if you want to track form submissions on your contact form, you could use: plausible-event-name=Form+Submit.

To represent a space character in the event names, you can use a + sign
For example: plausible-event-name=Form+Submit will display as Form Submit in your dashboard

Add a CSS class name in the 'Additional CSS class(es)' field
When tracking form submits, it is important to tag the <form> element itself with the plausible-event-name=... class (not the input or button element inside the form). Normally, Plausible can track button clicks, but if a button is inside a form, it will navigate to the next page often leaving not enough time for the event to finish.

Some CMSs (like Webflow) do not support an equals sign (=) in the classnames
If that's the case, use a double dash (--) instead of the equals sign. For example: plausible-event-name--signup

You can also add class names directly in HTML
If you can edit the raw HTML code of the element you want to track, you can also add the classes directly in HTML. For example:

<!-- before -->

<button>Click Me</button>

<!-- after -->

<button class="plausible-event-name=Button+Click">Click Me</button>

Or if your element already has a class attribute, just separate the new ones with a space:

<!-- before -->

<button class="some-existing-class">Click Me</button>

<!-- after -->

<button class="some-existing-class plausible-event-name=Button+Click">Click Me</button>

Verify that the CSS classes were added correctly
After adding the class, please go back to your site, and verify that the class attribute got added with the exact required format. You can check it by right-clicking the element and inspecting it. This will show you the HTML code of the element.

In some cases, the tracking classes might be added to a wrapper <div> element (parent to the element you want to track), but don't worry, Plausible will still be able to track clicks on the child element if its parent has the necessary classes.

Some CMSs like Webflow do not support an equals sign (=) in the classnames. If you add a class attribute with the value plausible-event-name=Signup, but when you go back to your page and inspect the element, it might have class="plausible-event-name-Signup" (equals sign replaced with a hyphen). If that's the case, use a double dash (--) instead of the equals sign. For example: plausible-event-name--signup.

Tracking form submissions may not work with forms that contain an element with id="submit" or name="submit"
To work around this limitation please rename the id or name attribute value to something else. If you're unable to do that, please look into implementing custom events manually with JavaScript

If your CMS does not support adding CSS classes, please expand the following section of instructions.

My site builder does not support adding CSS classes
If you're unable to add the classnames in your page editor, there's still a way for you to track custom events. This method includes copying and pasting some JavaScript code onto your page. You can expand this section and follow step-by-step instructions.

Step 4: Create a custom event goal in your Plausible account
When you send custom events to Plausible, they won't show up in your dashboard automatically. You'll have to configure the goal for the conversion numbers to show up.

To configure a goal, go to your website's settings in your Plausible account and visit the "Goals" section. You should see a list of current goals with a prompt to add a goal.

Add your first goal
Click on the "+ Add goal" button to go to the goal creation form.

Select Custom event as the goal trigger and enter the name of the custom event you are triggering. The name must match the one you added as a CSS class name on your site for conversions to appear in your analytics dashboard. So in our example where you added a CSS class name plausible-event-name=Form+Submit, the goal to add to your Plausible account is Form Submit (plus is replaced by a space).

Add your custom event goal
Next, click on the "Add goal" button and you'll be taken back to the Goals page. When you navigate back to your Plausible dashboard, you should see the number of visitors who triggered the custom event. Custom events are listed at the bottom of your dashboard and will appear as soon as the first conversion has been tracked.

If you happen to be sending events to Plausible already, you might see the following message under the "Add goal" button:

Add all custom event goals in a single action
You can click the link to automatically add all the goals you've been sending so far. If you end up not wanting to see some of them on the dashboard, you can simply remove them from the list.

That's it. You can now check our your goal conversions on the dashboard.

Edit a Custom Event Goal
To edit a custom event goal, start by locating the custom event goal you want to update in the Goals list. Click on the "Edit goal" button next to it, which will bring up the goal editing form.

Edit goal button
From the pop up, you can select a new custom event from the dropdown menu that matches the updated custom event you want to track. You can also edit the display name.

Edit custom even goal popup
Once you’ve made the necessary changes, simply click "Update goal," and your updated settings will be applied immediately. The changes will be reflected in your Plausible Analytics dashboard, with the goal now tracking based on the new settings you’ve configured.

Enhanced goal conversion tracking
Attach custom properties
Custom properties can be attached to events to capture dynamic elements and to further break down goal conversions. You can use custom properties to create your custom metrics to collect and analyze data that Plausible doesn't automatically track. Learn more here.

Monetary values to track ecommerce revenue
You can also send dynamic monetary values alongside custom events to track revenue attribution. Here's how to set up the ecommerce revenue tracking.

Create funnels to optimize your conversion rate
After you have the custom events in place, you can start creating marketing funnels to uncover possible issues, optimize your site and increase the conversion rate.
