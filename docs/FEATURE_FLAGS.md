# Using Feature Flags

Feature flags enable conditionally enabling and labelling features in Identity Server console dynamically. This approach allows you to 
deploy new features safely, perform A/B testing, and roll out features incrementally. In this guide, we'll walk through how to 
define and use feature flags in identity-apps React applications.

## High-Level Overview

- Identify the High-Level Feature: Determine the main feature that you want to control using feature flags.
- Locate Feature Config in Deployment Config: Ensure you have a configuration file or environment variables that manage your feature flags.
- Choose a Suitable Feature Identifier: Define a unique identifier for your sub-feature.
- Update the Disabled Features Array: Add your feature identifier to the disabledFeatures array in the feature configuration to disable it.
- Update/Add Feature Labels: Add or update labels in the `featureFlags` array to define status labels such as `Preview`, `New`, or `Beta`.
- Use Feature Flags in Your Code: Conditionally show/hide UI elements or run logic based on the feature flag, and change UI behaviour depending on feature labels.

## Conditionally Enabling/Disabling Features

You can use feature flags to conditionally disable or enable features and control whether certain UI elements are shown in the application.

### Step-by-Step Guide

1. Identify the High-Level Feature

First, determine which feature you want to control using a feature flag. For example, let's say we want to control the visibility
of a new "filter by metadata attribute" input field in organizations page. In this case, the high level feature is "organizations".

2. Locate Feature Config in Deployment Config

The deployment configuration in each React app includes a section for feature flags. Go to the file and locate the relevant
feature config object for your feature.

deployment.config.json:

```js
{
  "ui": {
    "features": {
      // other features,
      "organizations": { 
        "disabledFeatures": [],
        "enabled": true,
        "scopes": {
          "create": [ 
            "internal_organization_create"
          ],
          "delete": [ "internal_organization_delete" ],
          "feature": [ "console:organizations" ],
          "read": [ "internal_organization_view" ], 
          "update": [ "internal_organization_update" ] 
        }
      },   
    }
  }
}
```

3. Choose a Suitable Feature Identifier

Select a unique and descriptive identifier for your feature. For our example, we'll use `organizations.filterByMetadataAttributes`.

4. Update the Disabled Features Array
   
Add your feature identifier to the `disabledFeatures` array in your configuration.

Updated deployment.config.json:

```js
{
  "ui": {
    "features": [
      // other features,
      "organizations": { 
        "disabledFeatures": [
          "organizations.filterByMetadataAttributes"
        ],
        "enabled": true,
        "featureFlags": [],
        "scopes": {
          "create": [ 
            "internal_organization_create"
          ],
          "delete": [ "internal_organization_delete" ],
          "feature": [ "console:organizations" ],
          "read": [ "internal_organization_view" ], 
          "update": [ "internal_organization_update" ] 
        }
      },   
    ]
  }
}
```

5. Use Feature Flags in Your Code

Finally, use the feature flag to conditionally show/hide UI elements or run specific logic in your React components.

Example:

```js
import { isFeatureEnabled } from "@wso2is/core/helpers"

const App = () => {
  const organizationFeatureConfig: string[] = useSelector((state: AppState) =>
        state.config.ui.features?.organizations);

  return (
    <div>
      <h1>Organizations</h1>
      {isFeatureEnabled(organizationFeatureConfig, "organizations.filterByMetadataAttributes") && (
        <Select>
          <label>Select metadata attribute</label>
        </Select>
      )}
    </div>
  );
};

export default App;
```

In the above example, the "filter by metadata attribute" input is conditionally rendered based on the defined feature flag. If
`organizations.filterByMetadataAttributes` is included in the `disabledFeatures` array, the section will not be displayed.

## Changing UI Behaviour Using Feature Labels

In addition to the enabled and disabledFeatures-based approach above, identity-apps also supports a `featureFlags` array inside a feature config. This can be used to dynamically change UI behaviour by attaching labels such as `New`, `Beta`, or `Coming Soon`.

Unlike `disabledFeatures`, these labels do not automatically hide or disable UI elements. Instead, your component can be configured to read the label and decide how to display it.

### Step-by-Step Guide

1. Identify the High-Level Feature

First, identify the parent feature that owns the UI element. For example, assume we want to show a status label for a new "Export Users" button on the users page. In this case, the high-level feature is `users`.

2. Add a Feature Flag Entry to the Deployment Config

Add a `featureFlags` entry to the relevant feature config in `deployment.config.json`.

Updated deployment.config.json:

```js
{
  "ui": {
    "features": {
      // other features,
      "users": {
        "disabledFeatures": [],
        "enabled": true,
        "featureFlags": [
          {
            "feature": "users.exportButton",
            "flag": "NEW"
          }
        ],
        "scopes": {
          "create": [ "internal_user_mgt_create" ],
          "delete": [ "internal_user_mgt_delete" ],
          "feature": [ "console:users" ],
          "read": [ "internal_user_mgt_list" ],
          "update": [ "internal_user_mgt_update" ]
        }
      }
    }
  }
}
```

In the above example:

- `feature` identifies the specific UI element or sub-feature.
- `flag` defines the status label to be used.

3. Read the Feature Flag Value in Your Component

Use the `useFeatureFlag` hook to read the configured label from the `featureFlags` array and update the button text.

Example:

```tsx
import Button from "@oxygen-ui/react/Button";
import { AppState } from "@wso2is/admin.core.v1/store";
import useFeatureFlag from "@wso2is/admin.feature-gate.v1/hooks/use-feature-flag";
import { FeatureFlagsInterface } from "@wso2is/core/models";
import React from "react";
import { useSelector } from "react-redux";

const App = () => {
  const userFeatureFlags: FeatureFlagsInterface[] = useSelector(
    (state: AppState) => state.config.ui.features?.users?.featureFlags
  );

  const exportButtonFlag: string | null = useFeatureFlag("users.exportButton", userFeatureFlags);

  return (
    <Button>
      { exportButtonFlag === "NEW" ? "Export Users [New]" : "Export Users" }
    </Button>
  );
};

export default App;
```

In the above example, if the configured flag value is `NEW`, the button text becomes: `Export Users [New]`

4. Use `FeatureFlagLabel` for Standard UI Labels

You can also render the status label as a reusable UI element instead of directly modifying the text by using the `FeatureFlagLabel` component. This component reads the flag and renders it as a `chip` or a `ribbon`.

`FeatureFlagLabel` currently supports the following flag values:

- `NEW`
- `BETA`
- `COMING_SOON`
- `PREVIEW`

Example:

```tsx
import Button from "@oxygen-ui/react/Button";
import FeatureFlagLabel from "@wso2is/admin.feature-gate.v1/components/feature-flag-label";

const App = () => {
  const userFeatureFlags: FeatureFlagsInterface[] = useSelector(
    (state: AppState) => state.config.ui.features?.users?.featureFlags
  );
  
  return (
    <Button>
      Export Users
      <FeatureFlagLabel
        featureFlags={ userFeatureFlags }
        featureKey="users.exportButton"
        type="chip"
      />
    </Button>
  );
};

export default App;
```

You can use:

- `type="chip"` to render the label as a chip.
  <br><br><img width="236" height="69" alt="image" src="https://github.com/user-attachments/assets/7b88c1d7-b819-4ddd-8aed-30f352cc105c" /><br>

- `type="ribbon"` to render the label as a ribbon.
  <br><br><img width="465" height="223" alt="ribbon" src="https://github.com/user-attachments/assets/b5fa372e-3a87-4f73-a042-d8133bb7b5d2" /><br>


