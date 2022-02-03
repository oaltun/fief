from gettext import gettext as _

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from fastapi_users.manager import InvalidPasswordException, UserAlreadyExists

from fief.apps.auth.templates import templates
from fief.dependencies.auth import get_login_session
from fief.dependencies.authentication_flow import get_authentication_flow
from fief.dependencies.register import get_user_create
from fief.dependencies.tenant import get_current_tenant
from fief.dependencies.users import UserManager, get_user_manager
from fief.errors import RegisterException
from fief.models import LoginSession, Tenant
from fief.schemas.register import RegisterError
from fief.schemas.user import UserCreate
from fief.services.authentication_flow import AuthenticationFlow

router = APIRouter()


@router.get("/register", name="register:get", dependencies=[Depends(get_login_session)])
async def get_register(request: Request, tenant: Tenant = Depends(get_current_tenant)):
    return templates.TemplateResponse(
        "register.html",
        {"request": request, "tenant": tenant},
    )


@router.post("/register", name="register:post")
async def post_register(
    request: Request,
    user: UserCreate = Depends(get_user_create),
    user_manager: UserManager = Depends(get_user_manager),
    tenant: Tenant = Depends(get_current_tenant),
    login_session: LoginSession = Depends(get_login_session),
    authentication_flow: AuthenticationFlow = Depends(get_authentication_flow),
):
    try:
        created_user = await user_manager.create(user, safe=True, request=request)
    except UserAlreadyExists as e:
        raise RegisterException(
            RegisterError.get_user_already_exists(
                _("A user with the same email address already exists.")
            ),
            form_data=await request.form(),
            tenant=tenant,
        ) from e
    except InvalidPasswordException as e:
        raise RegisterException(
            RegisterError.get_invalid_password(e.reason),
            form_data=await request.form(),
            tenant=tenant,
        ) from e

    response = RedirectResponse(
        tenant.url_for(request, "auth:consent.get"),
        status_code=status.HTTP_302_FOUND,
    )
    response = await authentication_flow.create_session_token(response, created_user.id)

    return response
