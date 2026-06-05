"""
Servicio para envío de Web Push Notifications usando VAPID
"""
import os
import json
import logging
from typing import Optional
from pywebpush import webpush, WebPushException

from utils.database import get_db

logger = logging.getLogger(__name__)


def _get_vapid_config():
    return {
        "public_key": os.environ.get("VAPID_PUBLIC_KEY", ""),
        "private_key": os.environ.get("VAPID_PRIVATE_KEY", ""),
        "subject": os.environ.get("VAPID_SUBJECT", "mailto:admin@tecnonacho.com"),
    }


async def send_push_to_user(
    user_id: str,
    title: str,
    body: str,
    url: Optional[str] = None,
    icon: Optional[str] = None,
    tag: Optional[str] = None,
) -> dict:
    """
    Envía una notificación push a todas las suscripciones activas de un usuario.

    Returns:
        dict con {sent: int, failed: int, removed: int}
    """
    db = get_db()
    vapid = _get_vapid_config()

    if not vapid["public_key"] or not vapid["private_key"]:
        logger.warning("VAPID keys no configuradas. Push notifications desactivadas.")
        return {"sent": 0, "failed": 0, "removed": 0, "skipped": True}

    subs = await db.push_subscriptions.find({"user_id": user_id}).to_list(100)
    if not subs:
        return {"sent": 0, "failed": 0, "removed": 0}

    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url or "/",
        "icon": icon or "/logo-tecnonacho.png",
        "tag": tag or "tecnonacho-notification",
    })

    sent = failed = removed = 0
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": sub["keys"],
                },
                data=payload,
                vapid_private_key=vapid["private_key"],
                vapid_claims={"sub": vapid["subject"]},
            )
            sent += 1
        except WebPushException as exc:
            # Si la suscripción ya no es válida (410 Gone o 404), eliminarla
            status = getattr(exc.response, "status_code", None) if exc.response is not None else None
            if status in (404, 410):
                await db.push_subscriptions.delete_one({"_id": sub["_id"]})
                removed += 1
            else:
                logger.error(f"WebPushException ({status}) para sub {sub.get('endpoint','')[:60]}: {exc}")
                failed += 1
        except Exception as e:
            logger.error(f"Error inesperado enviando push: {e}")
            failed += 1

    return {"sent": sent, "failed": failed, "removed": removed}


async def send_push_to_role(
    role: str,
    title: str,
    body: str,
    url: Optional[str] = None,
    tag: Optional[str] = None,
    exclude_user_id: Optional[str] = None,
) -> dict:
    """
    Envía una notificación push a todos los usuarios de un rol específico.
    Útil para notificar a todos los admins/supervisores de un evento.
    """
    db = get_db()
    query = {"role": role, "activo": True}
    if exclude_user_id:
        query["id"] = {"$ne": exclude_user_id}

    users = await db.users.find(query, {"id": 1, "_id": 0}).to_list(500)
    totals = {"sent": 0, "failed": 0, "removed": 0, "users_targeted": len(users)}

    for u in users:
        res = await send_push_to_user(u["id"], title, body, url=url, tag=tag)
        for k in ("sent", "failed", "removed"):
            totals[k] += res.get(k, 0)

    return totals
