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

import Stack from "@oxygen-ui/react/Stack";
import Typography from "@oxygen-ui/react/Typography";
import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { useReactFlow } from "@xyflow/react";
import React, { FunctionComponent, HTMLAttributes, ReactElement } from "react";
import useAuthenticationFlowBuilderCore from "../../hooks/use-authentication-flow-builder-core-context";
import { Component } from "../../models/component";
import { Element } from "../../models/elements";

/**
 * Props interface of {@link ElementProperties}
 */
export type ElementPropertiesPropsInterface = IdentifiableComponentInterface & HTMLAttributes<HTMLDivElement>;

/**
 * Component to generate the properties panel for the selected element.
 *
 * @param props - Props injected to the component.
 * @returns The ElementProperties component.
 */
const ElementProperties: FunctionComponent<ElementPropertiesPropsInterface> = ({
    "data-componentid": componentId = "element-properties",
    ...rest
}: ElementPropertiesPropsInterface): ReactElement => {
    const { updateNodeData } = useReactFlow();
    const {
        lastInteractedElement,
        setLastInteractedElement,
        ElementProperties,
        lastInteractedNodeId
    } = useAuthenticationFlowBuilderCore();

    const changeSelectedVariant = (selected: string) => {
        const selectedVariant: Component = lastInteractedElement?.variants?.find(
            (element: Component) => element.variant === selected
        );

        updateNodeData(lastInteractedNodeId, (node: any) => {
            const components: Component = node?.data?.components?.map((component: any) => {
                if (component.id === lastInteractedElement.id) {
                    return {
                        ...component,
                        ...selectedVariant
                    };
                }

                return component;
            });

            setLastInteractedElement({
                ...lastInteractedElement,
                ...selectedVariant
            });

            return {
                components
            };
        });
    };

    const handlePropertyChange = (propertyKey: string, previousValue: any, newValue: any, element: Element) => {
        updateNodeData(lastInteractedNodeId, (node: any) => {
            const components: Component = node?.data?.components?.map((component: any) => {
                if (component.id === element.id) {
                    component.config.field[propertyKey] = newValue;
                }

                return component;
            });

            return {
                components
            };
        });
    };

    return (
        <div className="flow-builder-element-properties" data-componentid={ componentId } { ...rest }>
            { lastInteractedElement ? (
                <Stack gap={ 1 }>
                    { lastInteractedElement && (
                        <ElementProperties
                            element={ lastInteractedElement }
                            properties={ lastInteractedElement?.config?.field }
                            onChange={ handlePropertyChange }
                            onVariantChange={ changeSelectedVariant }
                        />
                    ) }
                </Stack>
            ) : (
                <Typography variant="body2" color="textSecondary" sx={ { padding: 2 } }>
                    No properties available.
                </Typography>
            ) }
        </div>
    );
};

export default ElementProperties;
