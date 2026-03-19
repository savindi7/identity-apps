/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { OnboardingStep } from "../models";

/**
 * Cutoff date for determining whether a user is "new".
 * Users with SCIM2 meta.created on or after this date are considered new.
 * TODO: Set this to the actual feature launch date before deployment.
 */
export const FEATURE_LAUNCH_DATE: string = "YYYY-MM-DD";

/**
 * Moesif event names.
 * Format: Area-PastTenseAction-ObjectOrResult in PascalCase with hyphens.
 */
export enum OnboardingAnalyticsEvents {
    COMPLETED = "Onboarding-Completed",
    SKIPPED = "Onboarding-Skipped",
    STARTED = "Onboarding-Started",
    STEP_BACK = "Onboarding-Step-Back",
    STEP_COMPLETED = "Onboarding-Step-Completed"
}

/**
 * Step name identifiers for Onboarding-Step-Completed metadata.
 * Each value is sent as the `step_name` field to differentiate step events.
 */
export enum OnboardingStepNames {
    APP_NAME_ENTERED = "app_name_entered",
    BRANDING_COLOR_SELECTED = "branding_color_selected",
    BRANDING_LOGO_SELECTED = "branding_logo_selected",
    REDIRECT_URL_CONFIGURED = "redirect_url_configured",
    SIGNIN_OPTIONS_CHOSEN = "signin_options_chosen",
    WELCOME_OPTION_SELECTED = "welcome_option_selected"
}

/**
 * Step names for analytics metadata.
 */
export const STEP_NAMES: Record<OnboardingStep, string> = {
    [OnboardingStep.WELCOME]: "welcome",
    [OnboardingStep.NAME_APPLICATION]: "app_name",
    [OnboardingStep.SELECT_APPLICATION_TEMPLATE]: "select_template",
    [OnboardingStep.CONFIGURE_REDIRECT_URL]: "redirect_url",
    [OnboardingStep.SIGN_IN_OPTIONS]: "sign_in_options",
    [OnboardingStep.DESIGN_LOGIN]: "design_login",
    [OnboardingStep.SUCCESS]: "success"
};
