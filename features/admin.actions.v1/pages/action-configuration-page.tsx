/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
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

import { FeatureAccessConfigInterface, Show, useRequiredScopes } from "@wso2is/access-control";
import { AppConstants, AppState, history } from "@wso2is/admin.core.v1";
import { AlertInterface, AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ConfirmationModal,
    DangerZone,
    DangerZoneGroup,
    DocumentationLink,
    PageLayout,
    useDocumentation
} from "@wso2is/react-components";
import { AxiosError } from "axios";
import React, {
    FunctionComponent,
    ReactElement,
    ReactNode,
    SyntheticEvent,
    useEffect,
    useMemo,
    useState
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { Checkbox, CheckboxProps, Grid } from "semantic-ui-react";
import changeActionStatus from "../api/change-action-status";
import deleteAction from "../api/delete-action";
import useGetActionsByType from "../api/use-get-actions-by-type";
import ActionConfigForm from "../components/action-config-form";
import { ActionsConstants } from "../constants/actions-constants";
import { ActionConfigFormPropertyInterface } from "../models/actions";
import "./action-configuration-page.scss";

/**
 * Props for the Action Configuration page.
 */
type ActionConfigurationPageInterface = IdentifiableComponentInterface;

const ActionConfigurationPage: FunctionComponent<ActionConfigurationPageInterface> = ({
    [ "data-componentid" ]: _componentId = "action-configuration-page"
}: ActionConfigurationPageInterface): ReactElement => {

    const actionsFeatureConfig: FeatureAccessConfigInterface = useSelector(
        (state: AppState) => state.config.ui.features.actions);
    const [ isOpenRevertConfigModal, setOpenRevertConfigModal ] = useState<boolean>(false);
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ isActive, setIsActive ] = useState<boolean>(false);
    const [ showCreateForm, setShowCreateForm ] = useState<boolean>(false);

    const dispatch: Dispatch = useDispatch();
    const { t } = useTranslation();
    const { getLink } = useDocumentation();

    const hasActionUpdatePermissions: boolean = useRequiredScopes(actionsFeatureConfig?.scopes?.update);

    const actionTypeApiPath: string = useMemo(() => {
        const path: string[] = history.location.pathname.split("/");
        const actionType: string = path[path.length - 1];

        switch (actionType) {
            case ActionsConstants.ACTION_TYPES.PRE_ISSUE_ACCESS_TOKEN.getUrlPath():
                return ActionsConstants.ACTION_TYPES.PRE_ISSUE_ACCESS_TOKEN.getApiPath();
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PASSWORD.getUrlPath():
                return ActionsConstants.ACTION_TYPES.PRE_UPDATE_PASSWORD.getApiPath();
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PROFILE.getUrlPath():
                return ActionsConstants.ACTION_TYPES.PRE_UPDATE_PROFILE.getApiPath();
            case ActionsConstants.ACTION_TYPES.PRE_REGISTRATION.getUrlPath():
                return ActionsConstants.ACTION_TYPES.PRE_REGISTRATION.getApiPath();
            default:
                return null;
        }
    }, [ history.location.pathname ]);

    const {
        data: actions,
        error: actionsFetchRequestError,
        isLoading: isActionsLoading,
        mutate: mutateActions
    } = useGetActionsByType(actionTypeApiPath);

    const isLoading: boolean = isActionsLoading || !actions || !Array.isArray(actions);

    const actionInitialValues: ActionConfigFormPropertyInterface = useMemo(() => {
        if (actions) {
            return {
                authenticationType: actions[0]?.endpoint?.authentication?.type.toString(),
                endpointUri: actions[0]?.endpoint?.uri,
                id: actions[0]?.id,
                name: actions[0]?.name
            };
        } else {
            return null;
        }
    }, [ actions ]);

    useEffect(() => {
        if (actions?.length >= 1) {
            setShowCreateForm(false);
            setIsActive(actions[0]?.status.toString() === ActionsConstants.ACTIVE_STATUS);
        } else {
            setShowCreateForm(true);
        }
    }, [ actions ]);

    /**
     * The following useEffect is used to handle if any error occurs while fetching the Action.
     */
    useEffect(() => {
        if (isActionsLoading || !actionsFetchRequestError) {
            return;
        }

        if (actionsFetchRequestError.response?.data?.description) {
            dispatch(
                addAlert<AlertInterface>({
                    description: t("actions:notification.error.fetch.description",
                        { description: actionsFetchRequestError.response.data.description }),
                    level: AlertLevels.ERROR,
                    message: t("actions:notification.error.fetch.message")
                })
            );
        } else {
            dispatch(
                addAlert<AlertInterface>({
                    description: t("actions:notification.genericError.fetch.description"),
                    level: AlertLevels.ERROR,
                    message: t("actions:notification.genericError.fetch.message")
                })
            );
        }
    }, [ isActionsLoading, actionsFetchRequestError ]);

    /**
     * Handles the back button click event.
     */
    const handleBackButtonClick = (): void => {
        history.push(AppConstants.getPaths().get("ACTIONS"));
    };

    /**
     * Resolves Title of the page.
     */
    const resolveActionTitle = (actionType: string): string => {
        switch(actionType) {
            case ActionsConstants.ACTION_TYPES.PRE_ISSUE_ACCESS_TOKEN.getApiPath():
                return t("actions:types.preIssueAccessToken.heading");
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PASSWORD.getApiPath():
                return t("actions:types.preUpdatePassword.heading");
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PROFILE.getApiPath():
                return t("actions:types.preUpdateProfile.heading");
            case ActionsConstants.ACTION_TYPES.PRE_REGISTRATION.getApiPath():
                return t("actions:types.preRegistration.heading");
        }
    };

    /**
     * Resolves description of the page.
     */
    const resolveActionDescription = (actionType: string): ReactNode => {
        switch(actionType) {
            case ActionsConstants.ACTION_TYPES.PRE_ISSUE_ACCESS_TOKEN.getApiPath():
                return (
                    <>
                        { t("actions:types.preIssueAccessToken.description.expanded") }
                        <DocumentationLink
                            link={
                                getLink("develop.actions.types.preIssueAccessToken.learnMore")
                            }
                            showEmptyLink={ false }
                        >
                            { t("common:learnMore") }
                        </DocumentationLink>
                    </>
                );
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PASSWORD.getApiPath():
                return (
                    <>
                        { t("actions:types.preUpdatePassword.description.expanded") }
                        <DocumentationLink
                            link={
                                getLink("develop.actions.types.preUpdatePassword.learnMore")
                            }
                            showEmptyLink={ false }
                        >
                            { t("common:learnMore") }
                        </DocumentationLink>
                    </>
                );
            case ActionsConstants.ACTION_TYPES.PRE_UPDATE_PROFILE.getApiPath():
                return (
                    <>
                        { t("actions:types.preUpdateProfile.description.expanded") }
                        <DocumentationLink
                            link={
                                getLink("develop.actions.types.preUpdateProfile.learnMore")
                            }
                            showEmptyLink={ false }
                        >
                            { t("common:learnMore") }
                        </DocumentationLink>
                    </>
                );
            case ActionsConstants.ACTION_TYPES.PRE_REGISTRATION.getApiPath():
                return (
                    <>
                        { t("actions:types.preRegistration.description.expanded") }
                        <DocumentationLink
                            link={
                                getLink("develop.actions.types.preRegistration.learnMore")
                            }
                            showEmptyLink={ false }
                        >
                            { t("common:learnMore") }
                        </DocumentationLink>
                    </>
                );
            default:
                return "";
        }
    };

    /**
     * This renders the toggle button for action status.
     */
    const actionToggle = (): ReactElement => {
        const handleToggle = (e: SyntheticEvent, data: CheckboxProps) => {
            const toggleOperation: string = data.checked ? ActionsConstants.ACTIVATE : ActionsConstants.DEACTIVATE;

            setIsActive(data.checked);
            setIsSubmitting(true);
            changeActionStatus(
                actionTypeApiPath,
                actionInitialValues.id,
                toggleOperation)
                .then(() => {
                    handleSuccess(toggleOperation);
                })
                .catch((error: AxiosError) => {
                    handleError(error, toggleOperation);
                })
                .finally(() => {
                    mutateActions();
                    setIsSubmitting(false);
                });
        };

        return !isLoading && !showCreateForm && (
            <Checkbox
                label={
                    isActive
                        ? t("actions:status.active")
                        : t("actions:status.inactive")
                }
                toggle
                onChange={ handleToggle }
                checked={ isActive }
                readOnly={ !hasActionUpdatePermissions }
                data-componentId={ `${ _componentId }-${ actionTypeApiPath }-enable-toggle` }
                disabled={ !hasActionUpdatePermissions }
            />
        );
    };

    const handleDelete = (): void => {
        setIsSubmitting(true);
        deleteAction(actionTypeApiPath, actionInitialValues.id)
            .then(() => {
                handleSuccess(ActionsConstants.DELETE);
                mutateActions();
                history.push(AppConstants.getPaths().get("ACTIONS"));
            })
            .catch((error: AxiosError) => {
                handleError(error, ActionsConstants.DELETE);
            })
            .finally(() => {
                setOpenRevertConfigModal(false);
                setIsSubmitting(false);
            });
    };

    const handleSuccess = (operation: string): void => {
        dispatch(
            addAlert({
                description: t("actions:notification.success." + operation + ".description"),
                level: AlertLevels.SUCCESS,
                message: t("actions:notification.success." + operation + ".message")
            })
        );
    };

    const handleError = (error: AxiosError, operation: string): void => {
        if (error.response?.data?.description) {
            dispatch(
                addAlert({
                    description: t("actions:notification.error." + operation + ".description",
                        { description: error.response.data.description }),
                    level: AlertLevels.ERROR,
                    message: t("actions:notification.error." + operation + ".message")
                })
            );
        } else {
            dispatch(
                addAlert({
                    description: t("actions:notification.genericError." + operation + ".description"),
                    level: AlertLevels.ERROR,
                    message: t("actions:notification.genericError." + operation + ".message")
                })
            );
        }
    };

    return (
        <PageLayout
            title={ resolveActionTitle(actionTypeApiPath) }
            description={ resolveActionDescription(actionTypeApiPath) }
            backButton={ {
                "data-componentid": `${ _componentId }-${ actionTypeApiPath }-page-back-button`,
                onClick: () => handleBackButtonClick(),
                text: t("actions:goBackActions")
            } }
            bottomMargin={ false }
            contentTopMargin={ true }
            pageHeaderMaxWidth={ false }
            data-componentid={ `${ _componentId }-${ actionTypeApiPath }-page-layout` }
        >
            { actionToggle() }
            {
                <Grid className="grid-form">
                    <Grid.Row columns={ 1 }>
                        <Grid.Column width={ 16 }>
                            <ActionConfigForm
                                initialValues={ actionInitialValues }
                                isLoading={ isLoading }
                                actionTypeApiPath={ actionTypeApiPath }
                                isCreateFormState={ showCreateForm }
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            }
            { !isLoading && !showCreateForm && (
                <Show
                    when={ actionsFeatureConfig?.scopes?.delete }
                >
                    <DangerZoneGroup
                        sectionHeader={ t("actions:dangerZoneGroup.header") }
                    >
                        <DangerZone
                            data-componentid={ `${ _componentId }-danger-zone` }
                            actionTitle={
                                t("actions:dangerZoneGroup.revertConfig.actionTitle")
                            }
                            header={ t("actions:dangerZoneGroup.revertConfig.heading") }
                            subheader={
                                t("actions:dangerZoneGroup.revertConfig.subHeading")
                            }
                            onActionClick={ (): void => {
                                setOpenRevertConfigModal(true);
                            } }
                        />
                    </DangerZoneGroup>
                    <ConfirmationModal
                        primaryActionLoading={ isSubmitting }
                        data-componentid={ `${ _componentId }-revert-confirmation-modal` }
                        onClose={ (): void => setOpenRevertConfigModal(false) }
                        type="negative"
                        open={ isOpenRevertConfigModal }
                        assertionHint={ t("actions:confirmationModal.assertionHint") }
                        assertionType="checkbox"
                        primaryAction={ t("common:confirm") }
                        secondaryAction={ t("common:cancel") }
                        onSecondaryActionClick={ (): void => setOpenRevertConfigModal(false) }
                        onPrimaryActionClick={ (): void => handleDelete() }
                        closeOnDimmerClick={ false }
                    >
                        <ConfirmationModal.Header
                            data-componentid={ `${ _componentId }-revert-confirmation-modal-header` }
                        >
                            { t("actions:confirmationModal.header") }
                        </ConfirmationModal.Header>
                        <ConfirmationModal.Message
                            data-componentid={
                                `${ _componentId }revert-confirmation-modal-message`
                            }
                            attached
                            negative
                        >
                            { t("actions:confirmationModal.message") }
                        </ConfirmationModal.Message>
                        <ConfirmationModal.Content>
                            { t("actions:confirmationModal.content") }
                        </ConfirmationModal.Content>
                    </ConfirmationModal>
                </Show>
            ) }
        </PageLayout>
    );
};

export default ActionConfigurationPage;
