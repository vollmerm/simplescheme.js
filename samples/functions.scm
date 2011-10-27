; higher order functions
(define adder (lambda (x)
  (lambda (y) (+ x y)))) ; return lambda function

((adder 5) 5)

(define (map-func proc lis)
   (cond ((null? lis) '())
         (#t (cons (proc (car lis))
                   (map-func proc (cdr lis))))))
(define (square x) (* x x))
(map-func square '(2 3 4))

; compute length of a list
(define len (lambda (L)
  (if (null? L) 0
      (+ 1 (len (cdr L))))))

(len '(1 2 3))
(len '(1 2 3 (4 5)))