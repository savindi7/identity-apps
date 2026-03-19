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

import { AppState } from "@wso2is/admin.core.v1/store";
import { ProfileInfoInterface } from "@wso2is/core/models";
import moesif from "moesif-browser-js";
import React, { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { FEATURE_LAUNCH_DATE, OnboardingAnalyticsEvents } from "../constants";
import { OnboardingChoice, OnboardingDataInterface, OnboardingStep } from "../models";

/**
 * Parameters for the useOnboardingAnalytics hook.
 */
interface UseOnboardingAnalyticsParams {
    currentStep: OnboardingStep;
    isFirstWizardRun: boolean;
    onboardingData: OnboardingDataInterface;
}

/**
 * Return type for the useOnboardingAnalytics hook.
 */
interface UseOnboardingAnalyticsReturn {
    trackCompleted: () => void;
    trackSkipped: (fromStep: OnboardingStep, fromStepName: string) => void;
    trackStarted: () => void;
    trackStepBack: (fromStep: OnboardingStep, toStep: OnboardingStep) => void;
    trackStepCompleted: (
        stepNumber: OnboardingStep,
        stepName: string,
        extraMetadata?: Record<string, unknown>
    ) => void;
}

/**
 * SCIM2 system schema URI for accessing user account type.
 */
const SCIM_SYSTEM_SCHEMA: string = "urn:scim:wso2:schema";

/**
 * Total step counts per wizard path (excluding lifecycle events started/completed).
 */
const TOTAL_STEPS_FULL_SETUP: number = 6;
const TOTAL_STEPS_PREVIEW: number = 4;

/**
 * Hook that provides Moesif analytics tracking for the onboarding wizard.
 *
 * Follows the WSO2 Unified Product Analytics Taxonomy:
 * - Event names use PascalCase-with-hyphens format
 * - Every event includes `product`, `asset_type`, `domain`, and `context` fields
 * - Step events use a single `Onboarding-Step-Completed` event with `step_name` in metadata
 *
 * @param params - Hook parameters including current step, data, and first-run flag.
 * @returns Object with tracking functions for each wizard event.
 */
export const useOnboardingAnalytics = (params: UseOnboardingAnalyticsParams): UseOnboardingAnalyticsReturn => {
    const { currentStep, isFirstWizardRun, onboardingData } = params;

    const profileInfo: ProfileInfoInterface = useSelector((state: AppState) => state.profile.profileInfo);
    const userId: string = useSelector((state: AppState) => state.profile.profileInfo?.id || "");
    // TODO: Uncomment identifyCompany below when deploying to Asgardeo.
    const _tenantUuid: string = useSelector((state: AppState) =>
        state?.organization?.userOrganizationId || ""
    );
    const moesifApplicationId: string = useSelector((state: AppState) =>
        (state?.config?.deployment?.extensions as Record<string, unknown>)?.moesifApplicationId as string || ""
    );

    const isEnabledRef: React.MutableRefObject<boolean> = useRef<boolean>(false);
    const visitedStepsRef: React.MutableRefObject<Set<number>> = useRef<Set<number>>(new Set<number>());

    // Initialize Moesif SDK on mount if application ID is configured.
    useEffect(() => {
        if (!moesifApplicationId) {
            return;
        }

        try {
            moesif.init({
                applicationId: moesifApplicationId,
                disableFetch: true
            });

            // Moesif User ID = Asgardeo user UUID (from SCIM2 /Me response)
            if (userId) {
                moesif.identifyUser(userId);
            }

            // TODO: Enable identifyCompany once running on Asgardeo where tenantUuid
            // is a real UUID. In identity-apps (local IS), userOrganizationId resolves
            // to "carbon.super" which is not the correct Moesif Company ID.
            // if (_tenantUuid) {
            //     moesif.identifyCompany(_tenantUuid);
            // }

            isEnabledRef.current = true;
        } catch (_error: unknown) {
            // eslint-disable-next-line no-console
            console.warn("Failed to initialize Moesif analytics:", _error);
            isEnabledRef.current = false;
        }
    }, []);

    // Track visited steps for is_revisit computation.
    useEffect(() => {
        visitedStepsRef.current.add(currentStep);
    }, [ currentStep ]);

    /**
     * Compute whether the current user is "new" based on SCIM2 meta.created date.
     */
    const getIsNewUser: () => boolean = useCallback((): boolean => {
        const createdDate: string = profileInfo?.meta?.created;

        if (!createdDate || FEATURE_LAUNCH_DATE === "YYYY-MM-DD") {
            return false;
        }

        return new Date(createdDate) >= new Date(FEATURE_LAUNCH_DATE);
    }, [ profileInfo?.meta?.created ]);

    /**
     * Compute whether the current user is the organization owner.
     */
    const getIsOwner: () => boolean = useCallback((): boolean => {
        return profileInfo?.[SCIM_SYSTEM_SCHEMA]?.userAccountType === "Owner";
    }, [ profileInfo ]);

    /**
     * Derive the wizard path string from the current onboarding choice.
     */
    const getWizardPath: () => string = useCallback((): string => {
        return onboardingData.choice === OnboardingChoice.SETUP ? "full_setup" : "preview";
    }, [ onboardingData.choice ]);

    /**
     * Build the common metadata object included in every analytics event.
     * Includes WSO2 taxonomy required fields (product, asset_type, domain, context)
     * and onboarding-specific fields.
     *
     * @param stepNumber - The current wizard step number.
     * @param stepName - The step name identifier (for step events) or empty string (for lifecycle events).
     * @returns Metadata object for the event.
     */
    const buildCommonMetadata: (
        stepNumber: OnboardingStep,
        stepName: string
    ) => Record<string, unknown> = useCallback(
        (stepNumber: OnboardingStep, stepName: string): Record<string, unknown> => {
            const wizardPath: string = getWizardPath();

            return {
                asset_type: "console",
                context: "onboarding",
                domain: window.location.hostname,
                is_first_wizard_run: isFirstWizardRun,
                is_new_user: getIsNewUser(),
                is_owner: getIsOwner(),
                is_revisit: visitedStepsRef.current.has(stepNumber),
                product: "identity",
                step_name: stepName,
                step_number: stepNumber,
                total_steps: wizardPath === "full_setup" ? TOTAL_STEPS_FULL_SETUP : TOTAL_STEPS_PREVIEW,
                wizard_path: wizardPath
            };
        },
        [ isFirstWizardRun, getIsNewUser, getIsOwner, getWizardPath ]
    );

    /**
     * Fire a Moesif track event with common metadata and optional extra properties.
     */
    const trackEvent: (
        eventName: string,
        stepNumber: OnboardingStep,
        stepName: string,
        extra?: Record<string, unknown>
    ) => void = useCallback(
        (
            eventName: string,
            stepNumber: OnboardingStep,
            stepName: string,
            extra?: Record<string, unknown>
        ): void => {
            if (!isEnabledRef.current) {
                return;
            }

            const metadata: Record<string, unknown> = {
                ...buildCommonMetadata(stepNumber, stepName),
                ...extra
            };

            moesif.track(eventName, metadata);
        },
        [ buildCommonMetadata ]
    );

    // ========================================================================
    // Lifecycle events
    // ========================================================================

    const trackStarted: () => void = useCallback((): void => {
        trackEvent(OnboardingAnalyticsEvents.STARTED, currentStep, "");
    }, [ trackEvent, currentStep ]);

    const trackCompleted: () => void = useCallback((): void => {
        trackEvent(OnboardingAnalyticsEvents.COMPLETED, currentStep, "");
    }, [ trackEvent, currentStep ]);

    const trackSkipped: (fromStep: OnboardingStep, fromStepName: string) => void = useCallback(
        (fromStep: OnboardingStep, fromStepName: string): void => {
            trackEvent(OnboardingAnalyticsEvents.SKIPPED, fromStep, fromStepName, {
                skipped_from_step: fromStep,
                skipped_from_step_name: fromStepName
            });
        },
        [ trackEvent ]
    );

    const trackStepBack: (fromStep: OnboardingStep, toStep: OnboardingStep) => void = useCallback(
        (fromStep: OnboardingStep, toStep: OnboardingStep): void => {
            trackEvent(OnboardingAnalyticsEvents.STEP_BACK, fromStep, "", {
                from_step: fromStep,
                to_step: toStep
            });
        },
        [ trackEvent ]
    );

    // ========================================================================
    // Step completion event (single event, differentiated by step_name metadata)
    // ========================================================================

    const trackStepCompleted: (
        stepNumber: OnboardingStep,
        stepName: string,
        extraMetadata?: Record<string, unknown>
    ) => void = useCallback(
        (
            stepNumber: OnboardingStep,
            stepName: string,
            extraMetadata?: Record<string, unknown>
        ): void => {
            trackEvent(OnboardingAnalyticsEvents.STEP_COMPLETED, stepNumber, stepName, extraMetadata);
        },
        [ trackEvent ]
    );

    return {
        trackCompleted,
        trackSkipped,
        trackStarted,
        trackStepBack,
        trackStepCompleted
    };
};
