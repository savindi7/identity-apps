<%--
  ~ Copyright (c) 2014-2025, WSO2 LLC. (https://www.wso2.com).
  ~
  ~ WSO2 LLC. licenses this file to you under the Apache License,
  ~ Version 2.0 (the "License"); you may not use this file except
  ~ in compliance with the License.
  ~ You may obtain a copy of the License at
  ~
  ~    http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
--%>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="org.owasp.encoder.Encode" %>
<%@ page import="java.io.File" %>
<%@ taglib prefix="layout" uri="org.wso2.identity.apps.taglibs.layout.controller" %>

<%@include file="includes/localize.jsp" %>
<%@include file="includes/init-url.jsp" %>
<%-- Branding Preferences --%>
<jsp:directive.include file="includes/branding-preferences.jsp"/>

<%
    String domainUnknown = AuthenticationEndpointUtil.i18n(resourceBundle, "domain.unknown");
    String errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, "authentication.failed.please.retry");
    boolean loginFailed = false;
    if (Boolean.parseBoolean(request.getParameter("authFailure"))) {
        loginFailed = true;
        if (request.getParameter("authFailureMsg") != null) {
            /*
            * Only allowing error messages defined in the resourceBundle.
            * AuthenticationEndpointUtil.i18n() will return the value of the provided key if the key is found
            * in the resourceBundle. If the key is not found, it will return the key itself.
            */
            String error = Encode.forJava(request.getParameter("authFailureMsg"));
            if (!error.equalsIgnoreCase(AuthenticationEndpointUtil.i18n(resourceBundle, error))) {
                errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, error);
            }

            if (domainUnknown.equalsIgnoreCase(error)) {
                errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, "domain.cannot.be.identified");
            }
        }
    }
%>

<% request.setAttribute("pageName","domain"); %>

<!doctype html>
<html lang="en-US">
<head>
    <%-- header --%>
    <%
        File headerFile = new File(getServletContext().getRealPath("extensions/header.jsp"));
        if (headerFile.exists()) {
    %>
        <jsp:include page="extensions/header.jsp"/>
    <% } else { %>
        <jsp:include page="includes/header.jsp"/>
    <% } %>
</head>
<body class="login-portal layout authentication-portal-layout" data-page="<%= request.getAttribute("pageName") %>">
    <layout:main layoutName="<%= layout %>" layoutFileRelativePath="<%= layoutFileRelativePath %>" data="<%= layoutData %>" >
        <layout:component componentName="ProductHeader">
            <%-- product-title --%>
            <%
                File productTitleFile = new File(getServletContext().getRealPath("extensions/product-title.jsp"));
                if (productTitleFile.exists()) {
            %>
                <jsp:include page="extensions/product-title.jsp"/>
            <% } else { %>
                <jsp:include page="includes/product-title.jsp"/>
            <% } %>
        </layout:component>
        <layout:component componentName="MainSection">
            <div class="ui segment">
                <h3 class="ui header">
                    <%=AuthenticationEndpointUtil.i18n(resourceBundle, "federated.login")%>
                </h3>

                <form action="<%=commonauthURL%>" method="post" id="loginForm" class="ui large form segment-form">
                    <% if (loginFailed) { %>
                    <div class="ui visible negative message" id="error-msg" ><%=Encode.forHtml(errorMessage)%></div>
                    <% } %>

                    <div class="field">
                        <input class="form-control" id="fidp" name="fidp" type="text" tabindex="0"
                                placeholder="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "domain")%>">
                    </div>

                    <input type="hidden" name="sessionDataKey" value='<%=Encode.forHtmlAttribute(request.getParameter("sessionDataKey"))%>'/>

                    <div class="buttons right aligned">
                        <button class="ui primary large button" type="submit">
                            <%=AuthenticationEndpointUtil.i18n(resourceBundle, "submit")%>
                        </button>
                    </div>
                </form>
            </div>
        </layout:component>
        <layout:component componentName="ProductFooter">
            <%-- product-footer --%>
            <%
                File productFooterFile = new File(getServletContext().getRealPath("extensions/product-footer.jsp"));
                if (productFooterFile.exists()) {
            %>
                <jsp:include page="extensions/product-footer.jsp"/>
            <% } else { %>
                <jsp:include page="includes/product-footer.jsp"/>
            <% } %>
        </layout:component>
        <layout:dynamicComponent filePathStoringVariableName="pathOfDynamicComponent">
            <jsp:include page="${pathOfDynamicComponent}" />
        </layout:dynamicComponent>
    </layout:main>

    <%-- footer --%>
    <%
        File footerFile = new File(getServletContext().getRealPath("extensions/footer.jsp"));
        if (footerFile.exists()) {
    %>
        <jsp:include page="extensions/footer.jsp"/>
    <% } else { %>
        <jsp:include page="includes/footer.jsp"/>
    <% } %>

    <script type="text/javascript">
        function doLogin() {
            var loginForm = document.getElementById('loginForm');
            loginForm.submit();
        }
    </script>
</body>
</html>
