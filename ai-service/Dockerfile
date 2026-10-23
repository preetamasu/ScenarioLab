FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt --target ${LAMBDA_TASK_ROOT}

COPY app ${LAMBDA_TASK_ROOT}/app
COPY scenarios ${LAMBDA_TASK_ROOT}/scenarios
COPY lambda_python.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_python.handler"]
