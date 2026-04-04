# Using Feature Flags

Feature flags enable conditionally enabling and labelling features in Identity Server console dynamically. This approach allows you to 
deploy new features safely, perform A/B testing, and roll out features incrementally. In this guide, we'll walk through how to 
define and use feature flags in identity-apps React applications.

## Contents

- [Conditionally Enabling/Disabling Features](#conditionally-enablingdisabling-features)
- [Changing UI Behaviour Using Feature Labels](#changing-ui-behaviour-using-feature-labels)
- [Using Nested Features (sub-features)](#using-nested-features-sub-features)

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
    "features": {
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
    }
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

First, identify the parent feature that owns the UI element. For example, assume we want to show a status label for a new "Export Organizations" button on the organizations page. In this case, the high-level feature is `organizations`.

2. Add a Feature Flag Entry to the Deployment Config

Add a `featureFlags` entry to the relevant feature config in `deployment.config.json`.

Updated deployment.config.json:

```js
{
  "ui": {
    "features": {
      // other features,
      "organizations": {
        "disabledFeatures": [],
        "enabled": true,
        "featureFlags": [
          {
            "feature": "organizations.exportButton",
            "flag": "NEW"
          }
        ],
        "scopes": {
          "create": [ "internal_organization_create" ],
          "delete": [ "internal_organization_delete" ],
          "feature": [ "console:organizations" ],
          "read": [ "internal_organization_view" ], 
          "update": [ "internal_organization_update" ] 
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

Use the `useFeatureFlag` hook to read the configured label from the `featureFlags` array and conditionally render a `Chip` next to the button label.

Example:

```tsx
import Button from "@oxygen-ui/react/Button";
import Chip from "@oxygen-ui/react/Chip";
import { AppState } from "@wso2is/admin.core.v1/store";
import useFeatureFlag from "@wso2is/admin.feature-gate.v1/hooks/use-feature-flag";
import { FeatureFlagsInterface } from "@wso2is/core/models";
import { useSelector } from "react-redux";

const App = () => {
  const organizationFeatureFlags: FeatureFlagsInterface[] = useSelector(
    (state: AppState) => state.config.ui.features?.organizations?.featureFlags
  );

  const exportButtonFlag: string | null = useFeatureFlag("organizations.exportButton", organizationFeatureFlags);

  return (
    <Button>
      Export Organizations
      { exportButtonFlag === "NEW" && (
        <Chip size="small" label="New" className="oxygen-chip-new" />
      ) }
    </Button>
  );
};

export default App;
```

In the above example, if the configured flag value is `NEW`, a `New` chip is rendered inside the button. If the flag is not set, the button renders without the chip.

4. Use `FeatureFlagLabel` for Standard UI Labels

You can also render the status label as a reusable UI element instead of directly modifying the elements by using the `FeatureFlagLabel` component. This component reads the flag and renders it as a `chip` or a `ribbon`.

`FeatureFlagLabel` currently supports the following flag values:

- `NEW`
- `BETA`
- `COMING_SOON`
- `PREVIEW`

Example:

```tsx
import Button from "@oxygen-ui/react/Button";
import { AppState } from "@wso2is/admin.core.v1/store";
import FeatureFlagLabel from "@wso2is/admin.feature-gate.v1/components/feature-flag-label";
import { FeatureFlagsInterface } from "@wso2is/core/models";
import { useSelector } from "react-redux";

const App = () => {
  const organizationFeatureFlags: FeatureFlagsInterface[] = useSelector(
    (state: AppState) => state.config.ui.features?.organizations?.featureFlags
  );
  
  return (
    <Button>
      Export Organizations
      <FeatureFlagLabel
        featureFlags={ organizationFeatureFlags }
        featureKey="organizations.exportButton"
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


## Using Nested Features (sub-features)

Features have scopes, which allow them to change their behaviour based on the permissions a user has. Sub-features can be used to create features that have a subset relationship to a parent feature. They can be configured to have more specialized or different scopes from their parent. The below example will show how to use sub-features.

### Step-by-Step Guide

1. Identify a sub-feature

Identify the sub-feature you want to implement. Say you want to add an "Export Organizations" button as a separate sub-feature under organizations with its own scopes. Let's assume that we want that feature to require the `internal_organization_view` and `internal_user_mgt_list` scopes under `read`. Notice that `internal_user_mgt_list` is not a permission required in the parent feature, which makes the sub-feature have more specialized permission requirements than its parent.

2. Add the sub-feature to the deployment config

```js
{
  "ui": {
    "features": {
      // other features,
      "organizations": {
        "disabledFeatures": [],
        "enabled": true,
        "featureFlags": [],
        "scopes": {
          "create": [ "internal_organization_create" ],
          "delete": [ "internal_organization_delete" ],
          "feature": [ "console:organizations" ],
          "read": [ "internal_organization_view" ],
          "update": [ "internal_organization_update" ]
        },
        "subFeatures": {
          // other sub-features
          "exportOrganizations": {
            "disabledFeatures": [],
            "enabled": true,
            "featureFlags": [],
            "scopes": {
                "create": [],
                "delete": [],
                "feature": [],
                "read": [
                        "internal_organization_view",
                        "internal_user_mgt_list"
                ],
                "update": []
            }
          }
        }
      }
    }
  }
}
```

3. Read the scope check result in your component and apply changes manually

```tsx
import Button from "@oxygen-ui/react/Button";
import { useRequiredScopes } from "@wso2is/access-control";
import { AppState } from "@wso2is/admin.core.v1/store";
import { useSelector } from "react-redux";

const App = () => {
    const organizationsFeatureConfig = useSelector(
        (state: AppState) => state?.config?.ui?.features?.organizations
    );

    const hasExportOrganizationsPermission = useRequiredScopes(
        organizationsFeatureConfig?.subFeatures?.exportOrganizations?.scopes?.read
    );

    return (
        <Button disabled={ !hasExportOrganizationsPermission }>
            Export Organizations
        </Button>
    );
};

export default App;
```

In this example, if the user does not have the required scopes, the button is disabled. This shows how to directly use the `useRequiredScopes` hook to conditionally change UI behaviour.

OR

4. Use `Show` to display or hide elements based on permissions

```tsx
import Button from "@oxygen-ui/react/Button";
import { Show } from "@wso2is/access-control";
import { AppState } from "@wso2is/admin.core.v1/store";
import { useSelector } from "react-redux";

const App = () => {
    const organizationsFeatureConfig = useSelector(
        (state: AppState) => state?.config?.ui?.features?.organizations
    );

    return (
        <Show when={ organizationsFeatureConfig?.subFeatures?.exportOrganizations?.scopes?.read }>
            <Button>
                Export Organizations
            </Button>
        </Show>
    );
};

export default App;
```

This example uses the `Show` component to conditionally render the button based on whether the user has the required scopes. If the user does not have the required scopes, the button will not be rendered. This is the recommended path if you just want to hide or show an element based on permissions.
