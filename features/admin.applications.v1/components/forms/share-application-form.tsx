/**
 * Copyright (c) 2023-2024, WSO2 LLC. (https://www.wso2.com).
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

import Collapse from "@mui/material/Collapse";
import { AppState } from "@wso2is/admin.core.v1";
import useGlobalVariables from "@wso2is/admin.core.v1/hooks/use-global-variables";
import {
    shareApplication,
    stopSharingApplication,
    unshareApplication
} from "@wso2is/admin.organizations.v1/api";
import useGetOrganizations from "@wso2is/admin.organizations.v1/api/use-get-organizations";
import useSharedOrganizations from "@wso2is/admin.organizations.v1/api/use-shared-organizations";
import {
    OrganizationInterface,
    OrganizationResponseInterface,
    ShareApplicationRequestInterface
} from "@wso2is/admin.organizations.v1/models";
import {
    AlertLevels,
    IdentifiableComponentInterface
} from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ContentLoader,
    Heading,
    Hint,
    Message,
    PrimaryButton,
    TransferComponent,
    TransferList,
    TransferListItem
} from "@wso2is/react-components";
import { AxiosError } from "axios";
import differenceBy from "lodash-es/differenceBy";
import escapeRegExp from "lodash-es/escapeRegExp";
import isEmpty from "lodash-es/isEmpty";
import React, {
    FormEvent,
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import {
    Divider,
    Grid,
    Radio
} from "semantic-ui-react";
import { ApplicationInterface, additionalSpProperty } from "../../models";

enum ShareType {
    SHARE_ALL,
    SHARE_SELECTED,
    UNSHARE
}

export interface ApplicationShareFormPropsInterface
    extends IdentifiableComponentInterface {
    /**
     * Editing application.
     */
    application: ApplicationInterface;
    /**
     * Specifies if the application sharing form should be triggered.
     */
    triggerApplicationShare?: boolean;
    /**
     * Callback when the application sharing completed.
     */
    onApplicationSharingCompleted?: () => void;
    /**
     * Make the form read only.
     */
    readOnly?: boolean;
}

export const ApplicationShareForm: FunctionComponent<ApplicationShareFormPropsInterface> = (
    props: ApplicationShareFormPropsInterface
) => {

    const {
        application,
        triggerApplicationShare,
        onApplicationSharingCompleted,
        [ "data-componentid" ]: componentId,
        readOnly
    } = props;

    const dispatch: Dispatch = useDispatch();
    const { t } = useTranslation();

    const currentOrganization: OrganizationResponseInterface = useSelector(
        (state: AppState) => state.organization.organization
    );

    const [ subOrganizationList, setSubOrganizationList ] = useState<Array<OrganizationInterface>>([]);
    const [ sharedOrganizationList, setSharedOrganizationList ] = useState<Array<OrganizationInterface>>([]);
    const [ tempOrganizationList, setTempOrganizationList ] = useState<OrganizationInterface[]>([]);
    const [ checkedUnassignedListItems, setCheckedUnassignedListItems ] = useState<OrganizationInterface[]>([]);
    const [ shareType, setShareType ] = useState<ShareType>(ShareType.UNSHARE);
    const [ sharedWithAll, setSharedWithAll ] = useState<boolean>(false);
    const [ filter, setFilter ] = useState<string>();
    const { isOrganizationManagementEnabled } = useGlobalVariables();

    const {
        data: organizations,
        isLoading: isOrganizationsFetchRequestLoading,
        isValidating: isOrganizationsFetchRequestValidating,
        error: organizationsFetchRequestError
    } = useGetOrganizations(
        isOrganizationManagementEnabled,
        null,
        null,
        null,
        null,
        true,
        false
    );

    const {
        data: sharedOrganizations,
        isLoading: isSharedOrganizationsFetchRequestLoading,
        isValidating: isSharedOrganizationsFetchRequestValidating,
        error: sharedOrganizationsFetchRequestError,
        mutate: mutateSharedOrganizationsFetchRequest
    } = useSharedOrganizations(
        application?.id,
        isOrganizationManagementEnabled
    );

    /**
     * Check if the organization list is loading.
     */
    const isLoading: boolean = useMemo(() => {
        if (!isOrganizationManagementEnabled) {
            return false;
        }

        return isOrganizationsFetchRequestLoading ||
            isSharedOrganizationsFetchRequestLoading ||
            isOrganizationsFetchRequestValidating ||
            isSharedOrganizationsFetchRequestValidating;
    }, [
        isOrganizationsFetchRequestLoading,
        isSharedOrganizationsFetchRequestLoading,
        isOrganizationsFetchRequestValidating,
        isSharedOrganizationsFetchRequestValidating
    ]);

    /**
     * Fetches the organization list.
     */
    useEffect(() => {
        if (organizations?.organizations) {
            setSubOrganizationList(organizations.organizations);
        }
    }, [ organizations ]);

    /**
     * Fetches the shared organizations list for the particular application.
     */
    useEffect(() => {
        if (sharedOrganizations?.organizations) {
            setSharedOrganizationList(sharedOrganizations.organizations);
        } else {
            setSharedOrganizationList([]);
        }
    }, [ sharedOrganizations ]);

    /**
     * Dispatches error notifications if organization fetch request fails.
     */
    useEffect(() => {
        if (!organizationsFetchRequestError) {
            return;
        }

        if (organizationsFetchRequestError?.response?.data?.description) {
            dispatch(addAlert({
                description: organizationsFetchRequestError?.response?.data?.description
                    ?? t("organizations:notifications.getOrganizationList.error.description"),
                level: AlertLevels.ERROR,
                message: organizationsFetchRequestError?.response?.data?.message
                    ?? t("organizations:notifications.getOrganizationList.error.message")
            }));

            return;
        }

        dispatch(
            addAlert({
                description: t(
                    "organizations:notifications.getOrganizationList" +
                        ".genericError.description"
                ),
                level: AlertLevels.ERROR,
                message: t(
                    "organizations:notifications." +
                        "getOrganizationList.genericError.mupdateEnableIndefiniteAccountLockDurationessage"
                )
            })
        );
    }, [ organizationsFetchRequestError ]);

    /**
     * Dispatches error notifications if shared organizations fetch request fails.
     */
    useEffect(() => {
        if (!sharedOrganizationsFetchRequestError) {
            return;
        }

        if (sharedOrganizationsFetchRequestError?.response?.data?.description) {
            dispatch(addAlert({
                description: sharedOrganizationsFetchRequestError?.response?.data?.description
                    ?? t("applications:edit.sections.shareApplication.getSharedOrganizations.genericError.description"),
                level: AlertLevels.ERROR,
                message: sharedOrganizationsFetchRequestError?.response?.data?.message
                    ?? t("applications:edit.sections.shareApplication.getSharedOrganizations.genericError.message")
            }));

            return;
        }

        dispatch(
            addAlert({
                description: t("applications:edit.sections.shareApplication" +
                        ".getSharedOrganizations.genericError.description"),
                level: AlertLevels.ERROR,
                message: t("applications:edit.sections.shareApplication" +
                        ".getSharedOrganizations.genericError.message")
            })
        );
    }, [ sharedOrganizationsFetchRequestError ]);

    useEffect(() => setTempOrganizationList(subOrganizationList || []),
        [ subOrganizationList ]
    );

    useEffect(() => setCheckedUnassignedListItems(sharedOrganizationList || []),
        [ sharedOrganizationList ]
    );

    useEffect(() => {
        if (!application) {
            return;
        }

        const isSharedWithAll: additionalSpProperty[] = application?.advancedConfigurations
            ?.additionalSpProperties?.filter((property: additionalSpProperty) =>
                property?.name === "shareWithAllChildren"
            );

        if (!isSharedWithAll || isSharedWithAll.length === 0) {
            setSharedWithAll(false);
        } else {
            setSharedWithAll(
                JSON.parse(isSharedWithAll[ 0 ]?.value)
                    ? JSON.parse(isSharedWithAll[ 0 ]?.value)
                    : false
            );
        }

    }, [ application ]);

    useEffect(() => {
        if (sharedWithAll) {
            setShareType(ShareType.SHARE_ALL);
        } else if (sharedOrganizationList?.length > 0 && !sharedWithAll) {
            setShareType(ShareType.SHARE_SELECTED);
        } else if ((!sharedOrganizationList || sharedOrganizationList?.length === 0) &&
            !sharedWithAll
        ) {
            setShareType(ShareType.UNSHARE);
        }
    }, [ sharedWithAll, sharedOrganizationList ]);

    useEffect(() => {
        if (triggerApplicationShare) {
            handleShareApplication();
        }
    }, [ triggerApplicationShare ]);

    const handleShareApplication: () => Promise<void> = useCallback(async () => {
        let shareAppData: ShareApplicationRequestInterface;
        let removedOrganization: OrganizationInterface[];

        if (shareType === ShareType.SHARE_ALL) {
            shareAppData = {
                shareWithAllChildren: true
            };
        } else if (shareType === ShareType.SHARE_SELECTED) {
            let addedOrganizations: string[];

            if (sharedWithAll) {
                addedOrganizations = checkedUnassignedListItems.map((org: OrganizationInterface) => org.id);

                await unshareApplication(application.id);

            } else {
                addedOrganizations = differenceBy(
                    checkedUnassignedListItems,
                    sharedOrganizationList,
                    "id"
                ).map((organization: OrganizationInterface) => organization.id);

                removedOrganization = differenceBy(
                    sharedOrganizationList,
                    checkedUnassignedListItems,
                    "id"
                );
            }

            shareAppData = {
                shareWithAllChildren: false,
                sharedOrganizations: addedOrganizations
            };
        }

        if (shareType === ShareType.SHARE_ALL || shareType === ShareType.SHARE_SELECTED) {
            shareApplication(
                currentOrganization.id,
                application.id,
                shareAppData
            )
                .then(() => {
                    dispatch(
                        addAlert({
                            description: t(
                                "applications:edit.sections.shareApplication" +
                                ".addSharingNotification.success.description"
                            ),
                            level: AlertLevels.SUCCESS,
                            message: t(
                                "applications:edit.sections.shareApplication" +
                                ".addSharingNotification.success.message"
                            )
                        })
                    );
                })
                .catch((error: AxiosError) => {
                    if (error.response.data.message) {
                        dispatch(
                            addAlert({
                                description: error.response.data.message,
                                level: AlertLevels.ERROR,
                                message: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.message"
                                )
                            })
                        );
                    } else {
                        dispatch(
                            addAlert({
                                description: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.message"
                                )
                            })
                        );
                    }
                })
                .finally(() => {
                    if (shareType === ShareType.SHARE_SELECTED) {
                        mutateSharedOrganizationsFetchRequest();
                    }

                    onApplicationSharingCompleted();
                });

            removedOrganization?.forEach((removedOrganization: OrganizationInterface) => {
                stopSharingApplication(
                    currentOrganization.id,
                    application.id,
                    removedOrganization.id
                )
                    .then(() => {
                        dispatch(
                            addAlert({
                                description: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".stopSharingNotification.success.description",
                                    { organization: removedOrganization.name }
                                ),
                                level: AlertLevels.SUCCESS,
                                message: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".stopSharingNotification.success.message"
                                )
                            })
                        );
                    })
                    .catch((error: AxiosError) => {
                        if (error.response.data.message) {
                            dispatch(
                                addAlert({
                                    description: error.response.data.message,
                                    level: AlertLevels.ERROR,
                                    message: t(
                                        "applications:edit.sections.shareApplication" +
                                        ".stopSharingNotification.genericError.message"
                                    )
                                })
                            );
                        } else {
                            dispatch(
                                addAlert({
                                    description: t(
                                        "applications:edit.sections.shareApplication" +
                                        ".stopSharingNotification.genericError.description",
                                        {
                                            organization:
                                                removedOrganization.name
                                        }
                                    ),
                                    level: AlertLevels.ERROR,
                                    message: t(
                                        "applications:edit.sections.shareApplication" +
                                        ".stopSharingNotification.genericError.message"
                                    )
                                })
                            );
                        }
                    });
            });
        } else if (shareType === ShareType.UNSHARE) {
            unshareApplication(application.id)
                .then(() => {
                    dispatch(
                        addAlert({
                            description: t(
                                "applications:edit.sections.shareApplication" +
                                ".stopAllSharingNotification.success.description"
                            ),
                            level: AlertLevels.SUCCESS,
                            message: t(
                                "applications:edit.sections.shareApplication" +
                                ".stopAllSharingNotification.success.message"
                            )
                        })
                    );
                })
                .catch((error: AxiosError) => {
                    if (error?.response?.data?.message) {
                        dispatch(
                            addAlert({
                                description: error.response.data.message,
                                level: AlertLevels.ERROR,
                                message: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.message"
                                )
                            })
                        );
                    } else {
                        dispatch(
                            addAlert({
                                description: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "applications:edit.sections.shareApplication" +
                                    ".addSharingNotification.genericError.message"
                                )
                            })
                        );
                    }
                })
                .finally(() => {
                    setSharedOrganizationList([]);
                    onApplicationSharingCompleted();
                });
        }
    }, [
        sharedOrganizationList,
        checkedUnassignedListItems,
        stopSharingApplication,
        dispatch,
        currentOrganization.id,
        application.id,
        shareType
    ]);

    const handleUnselectedListSearch = (e: FormEvent<HTMLInputElement>, { value }: { value: string }) => {
        let isMatch: boolean = false;
        const filteredOrganizationList: OrganizationInterface[] = [];

        if (!isEmpty(value)) {
            setFilter(value);
            const re: RegExp = new RegExp(escapeRegExp(value), "i");

            subOrganizationList &&
                subOrganizationList.map((organization: OrganizationInterface) => {
                    isMatch = re.test(organization.name);
                    if (isMatch) {
                        filteredOrganizationList.push(organization);
                    }
                });

            setTempOrganizationList(filteredOrganizationList);
        } else {
            setTempOrganizationList(subOrganizationList);
        }
    };

    const handleUnassignedItemCheckboxChange = (organization: OrganizationInterface) => {
        const checkedOrganizations: OrganizationInterface[] = [ ...checkedUnassignedListItems ];
        const index: number = checkedOrganizations.findIndex(
            (org: OrganizationInterface) => org.id === organization.id
        );

        if (index !== -1) {
            checkedOrganizations.splice(index, 1);
            setCheckedUnassignedListItems(checkedOrganizations);
        } else {
            checkedOrganizations.push(organization);
            setCheckedUnassignedListItems(checkedOrganizations);
        }
    };

    const handleHeaderCheckboxChange: () => void = useCallback(() => {
        if (checkedUnassignedListItems.length === subOrganizationList.length) {
            setCheckedUnassignedListItems([]);

            return;
        }

        setCheckedUnassignedListItems(subOrganizationList);
    }, [
        subOrganizationList,
        setTempOrganizationList,
        checkedUnassignedListItems
    ]);

    if (isLoading) {
        return (
            <ContentLoader inline="centered" active/>
        );
    };

    return (
        <>
            <Heading ellipsis as="h6">
                { t("applications:edit.sections.sharedAccess.subTitle") }
            </Heading>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={ 8 }>
                        <Radio
                            disabled={ readOnly }
                            label={ t(
                                "organizations:unshareApplicationRadio"
                            ) }
                            onChange={ () => setShareType(ShareType.UNSHARE) }
                            checked={ shareType === ShareType.UNSHARE }
                            data-componentid={ `${ componentId }-share-with-all-checkbox` }
                        />
                        <Hint inline popup>
                            { t(
                                "organizations:unshareApplicationInfo"
                            ) }
                        </Hint>
                        <Divider hidden className="mb-0 mt-0" />
                        <Radio
                            disabled={ readOnly }
                            label={ t(
                                "organizations:shareWithSelectedOrgsRadio"
                            ) }
                            onChange={ () => setShareType(ShareType.SHARE_SELECTED) }
                            checked={ shareType === ShareType.SHARE_SELECTED }
                            data-componentid={ `${ componentId }-share-with-all-checkbox` }
                        />
                        <Collapse
                            in={ shareType === ShareType.SHARE_SELECTED }
                            orientation="vertical"
                            timeout="auto"
                        >
                            <>
                                { sharedWithAll && (
                                    <Message warning className="ml-4 mt-3">
                                        <p>
                                            {
                                                t(
                                                    "applications:edit."
                                                    + "sections.shareApplication"
                                                    + ".switchToSelectiveShareFromSharingWithAllSuborgsWarning"
                                                )
                                            }
                                        </p>
                                    </Message>
                                ) }
                                <TransferComponent
                                    className="pl-2"
                                    disabled={ shareType !== ShareType.SHARE_SELECTED }
                                    selectionComponent
                                    searchPlaceholder={ t(
                                        "transferList:searchPlaceholder",
                                        { type: "organizations" }
                                    ) }
                                    handleUnelectedListSearch={
                                        handleUnselectedListSearch
                                    }
                                    data-componentId="application-share-modal-organization-transfer-component"
                                >
                                    <TransferList
                                        disabled={
                                            shareType !== ShareType.SHARE_SELECTED
                                        }
                                        isListEmpty={
                                            !(tempOrganizationList?.length > 0)
                                        }
                                        handleHeaderCheckboxChange={
                                            handleHeaderCheckboxChange
                                        }
                                        isHeaderCheckboxChecked={
                                            checkedUnassignedListItems?.length ===
                                            subOrganizationList?.length
                                        }
                                        listType="unselected"
                                        listHeaders={ [
                                            t(
                                                "transferList:list.headers.1"
                                            ),
                                            ""
                                        ] }
                                        emptyPlaceholderContent={
                                            !subOrganizationList || subOrganizationList?.length === 0
                                                ? t("organizations:placeholders.emptyList.subtitles.0")
                                                : filter
                                                    ? t("console:develop.placeholders.emptySearchResult.subtitles.0",
                                                        { query: filter }) + ". " +
                                                      t("console:develop.placeholders.emptySearchResult.subtitles.1")
                                                    : null

                                        }
                                        data-testid="application-share-modal-organization-transfer-component-all-items"
                                        emptyPlaceholderDefaultContent={ t(
                                            "organizations:placeholders.emptyList.subtitles.0"
                                        ) }
                                    >
                                        { tempOrganizationList?.map(
                                            (organization: OrganizationInterface, index: number) => {
                                                const organizationName: string =
                                                    organization?.name;
                                                const isChecked: boolean =
                                                    checkedUnassignedListItems.findIndex(
                                                        (org: OrganizationInterface) =>
                                                            org.id === organization.id
                                                    ) !== -1;

                                                return (
                                                    <TransferListItem
                                                        disabled={
                                                            shareType !==
                                                            ShareType.SHARE_SELECTED
                                                        }
                                                        handleItemChange={ () =>
                                                            handleUnassignedItemCheckboxChange(
                                                                organization
                                                            )
                                                        }
                                                        key={ index }
                                                        listItem={ organizationName }
                                                        listItemId={ organization.id }
                                                        listItemIndex={ index }
                                                        isItemChecked={ isChecked }
                                                        showSecondaryActions={ false }
                                                        data-testid={ "application-share-modal-"
                                                            + "organization-transfer-component"
                                                            + "-unselected-organizations"
                                                        }
                                                    />
                                                );
                                            }
                                        ) }
                                    </TransferList>
                                </TransferComponent>
                            </>
                        </Collapse>
                        <Divider hidden className="mb-0 mt-0" />
                        <Radio
                            label={ t(
                                "organizations:shareApplicationRadio"
                            ) }
                            onChange={ () => setShareType(ShareType.SHARE_ALL) }
                            checked={ shareType === ShareType.SHARE_ALL }
                            data-componentid={ `${ componentId }-share-with-all-checkbox` }
                        />
                        <Hint inline popup>
                            { t(
                                "organizations:shareApplicationInfo"
                            ) }
                        </Hint>
                        <Divider hidden />
                        <PrimaryButton
                            data-componentid={ `${ componentId }-update-button` }
                            onClick={ handleShareApplication }
                        >
                            { t("common:update") }
                        </PrimaryButton>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    );
};

/**
 * Default props for the component.
 */
ApplicationShareForm.defaultProps = {
    "data-componentid": "application-share-form"
};
